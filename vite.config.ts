import { defineConfig, configDefaults } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'
import seedNights from './src/data/nights'
import { rowToNight } from './src/services/nightMapper'
import { nightSlug } from './src/utils/slug'
import { nightSeo } from './src/utils/nightSeo'
import { buildSeoTags } from './src/utils/seoTags'
import { buildEventJsonLd } from './src/utils/eventJsonLd'
import { buildHomeJsonLd, HOME_TITLE, HOME_DESCRIPTION } from './src/utils/homeSeo'
import { buildAreasItemList } from './src/utils/areasJsonLd'
import type { ComedyNight } from './src/types/comedyNight'
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

function uniqueBoroughSlugs(nights: ComedyNight[]): string[] {
  const seen = new Set<string>()
  for (const n of nights) {
    if (n.status !== 'gone' && n.venue.area) {
      const borough = normalizeToBorough(n.venue.area)
      if (borough) seen.add(slugify(borough))
    }
  }
  return [...seen].sort()
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function writeSitemap(dist: string, siteUrl: string, nights: ComedyNight[]): void {
  const staticPaths = ['/', '/comedy', '/submit', '/auth']
  const nightPaths = nights.filter((n) => n.status !== 'gone').map((n) => `/night/${nightSlug(n)}`)
  const areaPaths = uniqueBoroughSlugs(nights).map((s) => `/comedy/${s}`)
  const lastmod = new Date().toISOString().slice(0, 10)
  const body = [...staticPaths, ...nightPaths, ...areaPaths]
    .map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  writeFileSync(resolve(dist, 'sitemap_index.xml'), xml)
  console.log(`[seo] wrote sitemap with ${staticPaths.length + nightPaths.length + areaPaths.length} urls`)
}

// Writes dist/night/<slug>.html per night: a copy of the built index.html with the
// night's title, description, canonical, Open Graph/Twitter tags and Event JSON-LD
// baked into the <head>. GitHub Pages serves these for /night/<slug> directly, so
// crawlers and social scrapers (which don't run JS) get full metadata; the SPA still
// hydrates from the same bundle, using the identical tags from buildSeoTags/nightSeo.
function prerenderNights(dist: string, siteUrl: string, nights: ComedyNight[]): void {
  const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  mkdirSync(resolve(dist, 'night'), { recursive: true })
  for (const night of nights) {
    const slug = nightSlug(night)
    const { title, description } = nightSeo(night)
    const { canonical, metas, jsonLd } = buildSeoTags({
      title,
      description,
      baseUrl: siteUrl,
      path: `/night/${slug}`,
      image: night.images?.[0],
      type: 'article',
      jsonLd: buildEventJsonLd(night, siteUrl),
    })
    const head = [
      `    <link rel="canonical" href="${escAttr(canonical)}" />`,
      ...metas.map((m) => `    <meta ${m.attr}="${m.key}" content="${escAttr(m.content)}" />`),
      jsonLd ? `    <script type="application/ld+json">${escJsonLd(jsonLd)}</script>` : '',
    ]
      .filter(Boolean)
      .join('\n')
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
      .replace(/\s*<meta name="description"[^>]*>/, '')
      .replace('</head>', `${head}\n  </head>`)
    const sched = night.schedules[0]
    const when = sched ? `${WEEKDAYS[sched.weekday]}s at ${escHtml(sched.startTime)}` : ''
    const body = `<main><h1>${escHtml(night.name)}</h1>${night.description ? `<p>${escHtml(night.description)}</p>` : ''}<p>${escHtml(night.venue.name)}${night.venue.area ? `, ${escHtml(night.venue.area)}` : ''}, London${when ? ` · ${when}` : ''}</p><p><a href="/comedy">More open mic comedy nights in London</a></p></main>`
    writeFileSync(resolve(dist, 'night', `${slug}.html`), injectBody(html, body))
  }
  console.log(`[seo] prerendered ${nights.length} night pages`)
}

function buildBoroughMap(nights: ComedyNight[]): Map<string, { name: string; nights: ComedyNight[] }> {
  const map = new Map<string, { name: string; nights: ComedyNight[] }>()
  for (const n of nights) {
    if (n.status === 'active' && n.venue.area) {
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

function prerenderAreasIndex(dist: string, siteUrl: string, boroughMap: Map<string, { name: string; nights: ComedyNight[] }>): void {
  const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  const title = 'Open Mic Comedy Nights in London by Borough | FindComedy'
  const description = 'Find open mic comedy nights, showcases and pro nights across every London borough — Camden, Hackney, Islington, Lambeth, Southwark and more. Every listing kept fresh by comedians and audiences who actually go.'
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
  const body = `<main><h1>Open Mic Comedy Nights in London</h1><p>Find open mic comedy nights, showcases and pro nights across every London borough. Every listing kept fresh by comedians and audiences who actually go.</p><ul>${listItems}</ul></main>`
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace('</head>', `${head}\n  </head>`)
  writeFileSync(resolve(dist, 'comedy.html'), injectBody(html, body))
  console.log(`[seo] prerendered /comedy index`)
}

function prerenderAreaPages(dist: string, siteUrl: string, boroughMap: Map<string, { name: string; nights: ComedyNight[] }>): void {
  const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
  mkdirSync(resolve(dist, 'comedy'), { recursive: true })
  for (const [slug, { name, nights }] of boroughMap) {
    const title = `Open Mic Comedy Nights in ${name}, London | FindComedy`
    const description = `Find open mic comedy, showcases and pro nights in ${name}, London. Every listing kept fresh by comedians and audiences who actually go.`
    const { canonical, metas } = buildSeoTags({ title, description, baseUrl: siteUrl, path: `/comedy/${slug}`, type: 'website' })
    const head = [
      `    <link rel="canonical" href="${escAttr(canonical)}" />`,
      ...metas.map((m) => `    <meta ${m.attr}="${m.key}" content="${escAttr(m.content)}" />`),
    ].join('\n')
    const listItems = nights
      .map((n) => {
        const day = n.schedules[0] ? WEEKDAYS[n.schedules[0].weekday] : ''
        return `<li><a href="/night/${nightSlug(n)}">${escHtml(n.name)}</a> — ${escHtml(n.venue.name)}${day ? ` · ${day}` : ''}</li>`
      })
      .join('')
    const body = `<main><h1>Open Mic Comedy Nights in ${escHtml(name)}, London</h1><p>Find open mic comedy, showcases and pro nights in ${escHtml(name)}, London. Every listing kept fresh by comedians and audiences who actually go.</p><ul>${listItems}</ul></main>`
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
      .replace(/\s*<meta name="description"[^>]*>/, '')
      .replace('</head>', `${head}\n  </head>`)
    writeFileSync(resolve(dist, 'comedy', `${slug}.html`), injectBody(html, body))
  }
  console.log(`[seo] prerendered ${boroughMap.size} borough pages`)
}

// Bakes the homepage's <head> (canonical, Open Graph/Twitter, WebSite + Organization
// JSON-LD) into dist/index.html so non-JS crawlers and social scrapers see full metadata
// for the most important page. Must run AFTER the night/area prerenders, which read
// dist/index.html as their clean template. The JSON-LD <script> reuses the runtime's
// "seo-jsonld" id so hydration updates it in place instead of emitting a duplicate.
function prerenderHome(dist: string, siteUrl: string, nights: ComedyNight[]): void {
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
    .filter((n) => n.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => {
      const day = n.schedules[0] ? WEEKDAYS[n.schedules[0].weekday] : ''
      return `<li><a href="/night/${nightSlug(n)}">${escHtml(n.name)}</a> — ${escHtml(n.venue.name)}${n.venue.area ? `, ${escHtml(n.venue.area)}` : ''}${day ? ` · ${day}` : ''}</li>`
    })
    .join('')
  const body = `<main><h1>Open Mic Comedy Nights in London</h1><p>${escHtml(HOME_DESCRIPTION)}</p><ul>${items}</ul></main>`
  writeFileSync(resolve(dist, 'index.html'), injectBody(html, body))
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
      writeSitemap(dist, siteUrl, nights)
      prerenderNights(dist, siteUrl, nights)
      prerenderAreasIndex(dist, siteUrl, boroughMap)
      prerenderAreaPages(dist, siteUrl, boroughMap)
      // Last: overwrites dist/index.html, so it must follow the prerenders above
      // that read it as their template.
      prerenderHome(dist, siteUrl, nights)
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
