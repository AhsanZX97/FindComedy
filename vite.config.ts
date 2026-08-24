import { defineConfig, configDefaults } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'
import seedNights from './src/data/nights'
import { rowToNight } from './src/services/nightMapper'
import { nightSlug } from './src/utils/slug'
import { nightSeo, TYPE_LABELS } from './src/utils/nightSeo'
import { formatScheduleEntryLong, WEEKDAY_LONG_LABELS } from './src/utils/formatSchedule'
import { buildSeoTags } from './src/utils/seoTags'
import { buildEventJsonLd } from './src/utils/eventJsonLd'
import { buildHomeJsonLd, HOME_TITLE, HOME_DESCRIPTION } from './src/utils/homeSeo'
import { buildAreasItemList } from './src/utils/areasJsonLd'
import type { ComedyNight, Level } from './src/types/comedyNight'
import { slugify } from './src/utils/slug'
import { normalizeToBorough } from './src/utils/londonBoroughs'

type Env = Record<string, string>

// Prefer live Supabase data so user-submitted nights are included; fall back to the
// bundled seed when the build has no Supabase credentials (e.g. local dev without .env).
async function fetchNights(env: Env): Promise<ComedyNight[]> {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return seedNights
  try {
    const { data, error } = await createClient(url, key).from('nights').select('*')
    if (error || !data) {
      console.warn(`[seo] Supabase fetch failed (${error?.message ?? 'no data'}); using seed data.`)
      return seedNights
    }
    return data.map((row) => rowToNight(row as Record<string, unknown>))
  } catch (err) {
    console.warn(`[seo] Supabase fetch threw (${String(err)}); using seed data.`)
    return seedNights
  }
}

const escAttr = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const escHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escJsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c')

type BoroughMap = Map<string, { name: string; nights: ComedyNight[] }>

/**
 * Only `active` nights are indexable. Paused and gone nights still get a prerendered
 * page so their URLs keep resolving, but they are marked noindex and kept out of the
 * sitemap and every internal link list — otherwise they crawl as orphans.
 */
const isIndexable = (n: ComedyNight): boolean => n.status === 'active'

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Browse London comedy nights' },
  { href: '/comedy', label: 'Comedy nights by London borough' },
  { href: '/submit', label: 'Submit a comedy night' },
]

/**
 * Nav baked into every prerendered body. Crawlers that don't run JS never see the
 * React header, so without this /submit has no incoming internal links at all.
 * The current page's own entry is dropped so no page self-links.
 */
function staticNav(current: string): string {
  const items = NAV_LINKS.filter((l) => l.href !== current)
    .map((l) => `<li><a href="${l.href}">${l.label}</a></li>`)
    .join('')
  return `<nav aria-label="Site"><ul>${items}</ul></nav>`
}

/** Sitewide borough links, so every borough page has many incoming links rather than one. */
function staticFooter(current: string, boroughMap: BoroughMap): string {
  const boroughs = [...boroughMap.entries()]
    .sort((a, b) => b[1].nights.length - a[1].nights.length)
    .filter(([slug]) => `/comedy/${slug}` !== current)
    .map(([slug, { name }]) => `<li><a href="/comedy/${slug}">Comedy nights in ${escHtml(name)}</a></li>`)
    .join('')
  return `<footer><h2>Open mic comedy across London</h2><ul>${boroughs}</ul>${staticNav(current)}</footer>`
}

/** Assembles a prerendered page body: content, then the shared nav/footer link block. */
function pageBody(current: string, boroughMap: BoroughMap, main: string): string {
  return `<main>${main}</main>${staticFooter(current, boroughMap)}`
}

/**
 * Spreads sibling links evenly across the pool instead of always linking the first
 * few, so no night page ends up with a single incoming internal link.
 */
function pickSiblings(pool: ComedyNight[], night: ComedyNight, count: number): ComedyNight[] {
  const others = pool.filter((n) => n.id !== night.id)
  if (others.length <= count) return others
  const hash = Math.abs([...night.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7))
  const start = hash % others.length
  return Array.from({ length: count }, (_, i) => others[(start + i) % others.length])
}

// Every URL here must be indexable and canonical to itself, or crawlers report it as a
// non-canonical page in the sitemap. That rules out /auth (noindex) and non-active nights.
function writeSitemap(dist: string, siteUrl: string, nights: ComedyNight[], boroughMap: BoroughMap): void {
  const staticPaths = ['/', '/comedy', '/submit']
  const nightPaths = nights.filter(isIndexable).map((n) => `/night/${nightSlug(n)}`)
  const areaPaths = [...boroughMap.keys()].sort().map((s) => `/comedy/${s}`)
  const lastmod = new Date().toISOString().slice(0, 10)
  const body = [...staticPaths, ...nightPaths, ...areaPaths]
    .map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  writeFileSync(resolve(dist, 'sitemap_index.xml'), xml)
  console.log(`[seo] wrote sitemap with ${staticPaths.length + nightPaths.length + areaPaths.length} urls`)
}

const LEVEL_LABELS: Record<Level, string> = {
  new: 'first-timers and new acts',
  experienced: 'experienced acts',
  pro: 'professionals',
}

/** The one fact a comedian checks before turning up, spelled out rather than abbreviated. */
function bringerLine({ bringer }: ComedyNight): string {
  if (!bringer.required) {
    return 'No bringer required — you can put your name down without bringing an audience member.'
  }
  const who = bringer.count === undefined ? 'a guest' : `${bringer.count} ${bringer.count === 1 ? 'guest' : 'guests'}`
  return `Bringer night — acts are asked to bring ${who}.${bringer.note ? ` ${escHtml(bringer.note)}` : ''}`
}

// The prerendered body is all a non-JS crawler ever sees, so it carries the same facts
// the hydrated page shows: what kind of night, when it runs, where it is, who it suits,
// and links out to sibling nights so no page sits on a single incoming internal link.
function nightMain(night: ComedyNight, pool: ComedyNight[], borough: string | null, boroughSlug: string | null): string {
  const area = night.venue.area
  const parts: string[] = [`<h1>${escHtml(night.name)}</h1>`]

  const areaSuffix = area ? `, ${escHtml(area)}` : ''
  parts.push(`<p>${escHtml(TYPE_LABELS[night.type])} comedy at ${escHtml(night.venue.name)}${areaSuffix}, London.</p>`)
  if (night.description.trim()) parts.push(`<p>${escHtml(night.description.trim())}</p>`)

  const schedules = night.schedules ?? []
  if (schedules.length > 0) {
    const items = schedules
      .map((sc) => `<li>${escHtml(formatScheduleEntryLong(sc))}${sc.note ? ` — ${escHtml(sc.note)}` : ''}</li>`)
      .join('')
    parts.push(`<h2>When ${escHtml(night.name)} runs</h2><ul>${items}</ul>`)
  }

  const place: string[] = [`<p>${escHtml(night.venue.name)}, ${escHtml(night.venue.address)}</p>`]
  if (night.venue.nearestStation) {
    place.push(`<p>Nearest station: ${escHtml(night.venue.nearestStation)}.</p>`)
  }
  if (night.wheelchairAccessible !== null) {
    place.push(`<p>${night.wheelchairAccessible ? 'Wheelchair accessible.' : 'Not wheelchair accessible.'}</p>`)
  }
  parts.push(`<h2>Where to find it</h2>${place.join('')}`)

  const who = night.levels.map((l) => LEVEL_LABELS[l]).filter(Boolean)
  const suits = who.length > 0 ? `Suits ${who.join(', ')}. ` : ''
  parts.push(`<h2>Who this night is for</h2><p>${suits}${bringerLine(night)}</p>`)
  if (night.howToBook.contact.trim()) {
    parts.push(`<p>How to book a spot: ${escHtml(night.howToBook.contact.trim())}</p>`)
  }

  const siblings = pickSiblings(pool, night, 6)
  if (siblings.length > 0) {
    const where = borough ? escHtml(borough) : 'London'
    const items = siblings
      .map((n) => `<li><a href="/night/${nightSlug(n)}">${escHtml(n.name)}</a> — ${escHtml(n.venue.name)}</li>`)
      .join('')
    parts.push(`<h2>Other comedy nights in ${where}</h2><ul>${items}</ul>`)
  }
  if (borough && boroughSlug) {
    parts.push(`<p><a href="/comedy/${boroughSlug}">See every comedy night in ${escHtml(borough)}</a></p>`)
  }
  return parts.join('')
}

// Writes dist/night/<slug>.html per night: a copy of the built index.html with the
// night's title, description, canonical, Open Graph/Twitter tags and Event JSON-LD
// baked into the <head>. Vercel serves these for /night/<slug> directly, so crawlers
// and social scrapers (which don't run JS) get full metadata and real body copy; the
// SPA still hydrates from the same bundle, using the identical tags from
// buildSeoTags/nightSeo. Paused and gone nights are prerendered too so their URLs keep
// resolving, but are marked noindex — nothing links to them, so indexing them would
// leave orphan pages behind.
function prerenderNights(dist: string, siteUrl: string, nights: ComedyNight[], boroughMap: BoroughMap): void {
  const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  mkdirSync(resolve(dist, 'night'), { recursive: true })
  const active = nights.filter(isIndexable)
  for (const night of nights) {
    const slug = nightSlug(night)
    const borough = night.venue.area ? normalizeToBorough(night.venue.area) : null
    const boroughSlug = borough ? slugify(borough) : null
    const pool = (boroughSlug && boroughMap.get(boroughSlug)?.nights) || active
    const { title, description } = nightSeo(night)
    const { canonical, metas, jsonLd } = buildSeoTags({
      title,
      description,
      baseUrl: siteUrl,
      path: `/night/${slug}`,
      image: night.images?.[0],
      type: 'article',
      jsonLd: buildEventJsonLd(night, siteUrl) ?? undefined,
    })
    const head = [
      `    <link rel="canonical" href="${escAttr(canonical)}" />`,
      isIndexable(night) ? '' : '    <meta name="robots" content="noindex,follow" />',
      ...metas.map((m) => `    <meta ${m.attr}="${m.key}" content="${escAttr(m.content)}" />`),
      jsonLd ? `    <script type="application/ld+json">${escJsonLd(jsonLd)}</script>` : '',
    ]
      .filter(Boolean)
      .join('\n')
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
      .replace(/\s*<meta name="description"[^>]*>/, '')
      .replace('</head>', `${head}\n  </head>`)
    const main = nightMain(night, pool, borough, boroughSlug)
    writeFileSync(resolve(dist, 'night', `${slug}.html`), injectBody(html, pageBody(`/night/${slug}`, boroughMap, main)))
  }
  console.log(`[seo] prerendered ${nights.length} night pages (${nights.length - active.length} noindex)`)
}

function buildBoroughMap(nights: ComedyNight[]): BoroughMap {
  const map: BoroughMap = new Map()
  for (const n of nights) {
    if (isIndexable(n) && n.venue.area) {
      const borough = normalizeToBorough(n.venue.area)
      if (!borough) continue
      const slug = slugify(borough)
      const entry = map.get(slug) ?? { name: borough, nights: [] }
      entry.nights.push(n)
      map.set(slug, entry)
    }
  }
  return map
}

function injectBody(template: string, bodyHtml: string): string {
  return template.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
}

/** Active nights whose area doesn't resolve to a borough — they appear on no borough page. */
function unplacedNights(nights: ComedyNight[]): ComedyNight[] {
  return nights
    .filter((n) => isIndexable(n) && !(n.venue.area && normalizeToBorough(n.venue.area)))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function prerenderAreasIndex(dist: string, siteUrl: string, boroughMap: BoroughMap, nights: ComedyNight[]): void {
  const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  const title = 'Open Mic Comedy Nights in London by Borough | FindComedy'
  // Kept under 155 characters — anything longer is truncated in the SERP snippet.
  const description = 'Open mic comedy nights, showcases and pro nights in every London borough — Camden, Hackney, Islington, Lambeth and more. Kept fresh by comedians.'
  const { canonical, metas } = buildSeoTags({ title, description, baseUrl: siteUrl, path: '/comedy', type: 'website' })
  const sorted = [...boroughMap.entries()].sort((a, b) => b[1].nights.length - a[1].nights.length)
  const jsonLd = buildAreasItemList(sorted.map(([slug, { name }]) => ({ name, slug })), siteUrl)
  const head = [
    `    <link rel="canonical" href="${escAttr(canonical)}" />`,
    ...metas.map((m) => `    <meta ${m.attr}="${m.key}" content="${escAttr(m.content)}" />`),
    `    <script type="application/ld+json" id="seo-jsonld">${escJsonLd(jsonLd)}</script>`,
  ].join('\n')
  const listItems = sorted
    .map(([slug, { name, nights }]) =>
      `<li><a href="/comedy/${slug}">Open Mic Comedy in ${escHtml(name)} (${nights.length} ${nights.length === 1 ? 'night' : 'nights'})</a></li>`,
    )
    .join('')
  // Without this block, a night in an area that maps to no borough is reachable from the
  // homepage only, which leaves it on a single incoming internal link.
  const unplaced = unplacedNights(nights)
  const unplacedSection = unplaced.length
    ? `<h2>Elsewhere in London</h2><ul>${unplaced
        .map((n) => `<li><a href="/night/${nightSlug(n)}">${escHtml(n.name)}</a> — ${escHtml(n.venue.name)}</li>`)
        .join('')}</ul>`
    : ''
  const main = `<h1>Open Mic Comedy Nights in London</h1><p>Find open mic comedy nights, showcases and pro nights across every London borough. Every listing kept fresh by comedians and audiences who actually go.</p><ul>${listItems}</ul>${unplacedSection}`
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace('</head>', `${head}\n  </head>`)
  writeFileSync(resolve(dist, 'comedy.html'), injectBody(html, pageBody('/comedy', boroughMap, main)))
  console.log(`[seo] prerendered /comedy index`)
}

function prerenderAreaPages(dist: string, siteUrl: string, boroughMap: BoroughMap): void {
  const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  mkdirSync(resolve(dist, 'comedy'), { recursive: true })
  for (const [slug, { name, nights }] of [...boroughMap.entries()]) {
    const title = `Open Mic Comedy Nights in ${name}, London | FindComedy`
    const description = `Find open mic comedy, showcases and pro nights in ${name}, London. Every listing kept fresh by comedians and audiences who actually go.`
    const { canonical, metas } = buildSeoTags({ title, description, baseUrl: siteUrl, path: `/comedy/${slug}`, type: 'website' })
    const head = [
      `    <link rel="canonical" href="${escAttr(canonical)}" />`,
      ...metas.map((m) => `    <meta ${m.attr}="${m.key}" content="${escAttr(m.content)}" />`),
    ].join('\n')
    const listItems = nights
      .map((n) => {
        const day = n.schedules[0] ? WEEKDAY_LONG_LABELS[n.schedules[0].weekday] : ''
        return `<li><a href="/night/${nightSlug(n)}">${escHtml(n.name)}</a> — ${escHtml(n.venue.name)}${day ? ` · ${day}` : ''}</li>`
      })
      .join('')
    const main = `<h1>Open Mic Comedy Nights in ${escHtml(name)}, London</h1><p>Find open mic comedy, showcases and pro nights in ${escHtml(name)}, London. Every listing kept fresh by comedians and audiences who actually go.</p><ul>${listItems}</ul><p>Running a night in ${escHtml(name)} that isn't listed? <a href="/submit">Add it to FindComedy</a>.</p>`
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
      .replace(/\s*<meta name="description"[^>]*>/, '')
      .replace('</head>', `${head}\n  </head>`)
    writeFileSync(resolve(dist, 'comedy', `${slug}.html`), injectBody(html, pageBody(`/comedy/${slug}`, boroughMap, main)))
  }
  console.log(`[seo] prerendered ${boroughMap.size} borough pages`)
}

/**
 * Writes a static page from the built index.html template with its own title,
 * description and self-canonical. Used for the routes that have no data behind them
 * but still need to stop resolving as duplicates of the homepage.
 */
function prerenderStatic(
  dist: string,
  siteUrl: string,
  opts: { path: string; file: string; title: string; description: string; noindex?: boolean; main: string },
  boroughMap: BoroughMap,
): void {
  const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  const { canonical, metas } = buildSeoTags({
    title: opts.title,
    description: opts.description,
    baseUrl: siteUrl,
    path: opts.path,
    type: 'website',
  })
  const head = [
    `    <link rel="canonical" href="${escAttr(canonical)}" />`,
    opts.noindex ? '    <meta name="robots" content="noindex,follow" />' : '',
    ...metas.map((m) => `    <meta ${m.attr}="${m.key}" content="${escAttr(m.content)}" />`),
  ]
    .filter(Boolean)
    .join('\n')
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(opts.title)}</title>`)
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace('</head>', `${head}\n  </head>`)
  writeFileSync(resolve(dist, opts.file), injectBody(html, pageBody(opts.path, boroughMap, opts.main)))
  console.log(`[seo] prerendered ${opts.path}`)
}

const SUBMIT_MAIN =
  '<h1>Submit a London Comedy Night</h1>' +
  '<p>Run an open mic, showcase or pro comedy night in London? Add it to FindComedy so comedians looking for a spot and audiences looking for a night out can find it. Listing is free and takes about two minutes.</p>' +
  '<h2>What to include</h2>' +
  '<ul>' +
  '<li>The name of the night and the venue it runs at.</li>' +
  '<li>The day and start time, and whether it runs weekly, fortnightly or monthly.</li>' +
  '<li>Whether acts need to bring a guest, and how many.</li>' +
  '<li>How comedians book a spot — an email address, a form or a sign-up link.</li>' +
  '</ul>' +
  '<h2>What happens next</h2>' +
  '<p>Every submission is reviewed by hand before it goes live, so details get checked rather than published blind. Once approved, the night gets its own page with its schedule, venue and booking details, and appears on the borough page for its area.</p>'

const AUTH_MAIN =
  '<h1>Sign in to FindComedy</h1>' +
  '<p>Signing in lets you save nights you want to go to and report listings that have changed. Browsing comedy nights does not need an account.</p>'

// Bakes the homepage's <head> (canonical, Open Graph/Twitter, WebSite + Organization
// JSON-LD) into dist/index.html so non-JS crawlers and social scrapers see full metadata
// for the most important page. Must run AFTER the night/area prerenders, which read
// dist/index.html as their clean template. The JSON-LD <script> reuses the runtime's
// "seo-jsonld" id so hydration updates it in place instead of emitting a duplicate.
function prerenderHome(dist: string, siteUrl: string, nights: ComedyNight[], boroughMap: BoroughMap): void {
  const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  const { canonical, metas, jsonLd } = buildSeoTags({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    baseUrl: siteUrl,
    path: '/',
    type: 'website',
    jsonLd: buildHomeJsonLd(siteUrl),
  })
  const head = [
    `    <link rel="canonical" href="${escAttr(canonical)}" />`,
    ...metas.map((m) => `    <meta ${m.attr}="${m.key}" content="${escAttr(m.content)}" />`),
    jsonLd ? `    <script type="application/ld+json" id="seo-jsonld">${escJsonLd(jsonLd)}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(HOME_TITLE)}</title>`)
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace('</head>', `${head}\n  </head>`)
  const items = nights
    .filter(isIndexable)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => {
      const day = n.schedules[0] ? WEEKDAY_LONG_LABELS[n.schedules[0].weekday] : ''
      return `<li><a href="/night/${nightSlug(n)}">${escHtml(n.name)}</a> — ${escHtml(n.venue.name)}${n.venue.area ? `, ${escHtml(n.venue.area)}` : ''}${day ? ` · ${day}` : ''}</li>`
    })
    .join('')
  const main = `<h1>Open Mic Comedy Nights in London</h1><p>${escHtml(HOME_DESCRIPTION)}</p><ul>${items}</ul>`
  writeFileSync(resolve(dist, 'index.html'), injectBody(html, pageBody('/', boroughMap, main)))
  console.log('[seo] prerendered homepage head + body')
}

// Writes dist/404.html: a real, self-contained "page not found" served by Vercel
// (with a genuine 404 status) for any path not in the rewrite allowlist. It is NOT a
// SPA fallback — it ships no app JS and does not redirect, so unknown URLs can't become
// soft-404 duplicates of the homepage. Standalone styles (not Tailwind) so it never
// depends on the content-scan or the hashed CSS filename.
function write404Page(dist: string): void {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Page not found | FindComedy</title>
    <link rel="icon" type="image/svg+xml" href="/mic.svg" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; margin: 0; }
      body {
        min-height: 100vh; display: flex; align-items: center; justify-content: center;
        padding: 1rem; background: #09090b; color: #fff; text-align: center;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      main { max-width: 28rem; }
      .code { font-size: 4rem; font-weight: 700; line-height: 1; color: #fbbf24; }
      h1 { margin-top: 1rem; font-size: 1.5rem; font-weight: 600; }
      p { margin-top: 0.75rem; color: #a1a1aa; }
      a {
        display: inline-block; margin-top: 1.5rem; padding: 0.625rem 1.25rem;
        border-radius: 0.5rem; background: #fbbf24; color: #09090b;
        font-weight: 500; text-decoration: none;
      }
      a:hover { background: #fcd34d; }
    </style>
  </head>
  <body>
    <main>
      <p class="code">404</p>
      <h1>This page took the night off</h1>
      <p>We couldn't find that page. The link may be wrong, or the night may have ended.</p>
      <a href="/">Browse comedy nights</a>
    </main>
  </body>
</html>
`
  writeFileSync(resolve(dist, '404.html'), html)
  console.log('[seo] wrote 404.html')
}

// Generates SEO artifacts after the bundle is written: sitemap.xml + per-night static HTML + area pages.
function seoArtifacts(siteUrl: string, env: Env): Plugin {
  return {
    name: 'seo-artifacts',
    apply: 'build',
    async closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const nights = await fetchNights(env)
      const boroughMap = buildBoroughMap(nights)
      writeSitemap(dist, siteUrl, nights, boroughMap)
      prerenderNights(dist, siteUrl, nights, boroughMap)
      prerenderAreasIndex(dist, siteUrl, boroughMap, nights)
      prerenderAreaPages(dist, siteUrl, boroughMap)
      prerenderStatic(
        dist,
        siteUrl,
        {
          path: '/submit',
          file: 'submit.html',
          title: 'Submit a London Comedy Night | FindComedy',
          description:
            'Run an open mic, showcase or pro comedy night in London? Add it to FindComedy so comedians and audiences can find it. Free, and it takes two minutes.',
          main: SUBMIT_MAIN,
        },
        boroughMap,
      )
      // Sign-in has nothing to rank for and would otherwise be served the homepage's
      // canonical, making it a duplicate of "/". Self-canonical + noindex instead.
      prerenderStatic(
        dist,
        siteUrl,
        {
          path: '/auth',
          file: 'auth.html',
          title: 'Sign in | FindComedy',
          description: 'Sign in to save comedy nights and report listings that have changed.',
          noindex: true,
          main: AUTH_MAIN,
        },
        boroughMap,
      )
      // Last: overwrites dist/index.html, so it must follow the prerenders above
      // that read it as their template.
      prerenderHome(dist, siteUrl, nights, boroughMap)
      write404Page(dist)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL ?? 'https://www.findcomedy.xyz').replace(/\/$/, '')
  return {
    plugins: [react(), seoArtifacts(siteUrl, env)],
    base: '/',
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      // E2E lives under e2e/ and runs via Playwright, not Vitest. The generated
      // .features-gen/ specs use Playwright's test runner and must be excluded here.
      exclude: [...configDefaults.exclude, 'e2e/**', '.features-gen/**'],
    },
  }
})
