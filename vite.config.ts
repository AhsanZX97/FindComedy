import { defineConfig } from 'vitest/config'
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
  writeFileSync(resolve(dist, 'sitemap.xml'), xml)
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
    writeFileSync(resolve(dist, 'night', `${slug}.html`), html)
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
  const head = [
    `    <link rel="canonical" href="${escAttr(canonical)}" />`,
    ...metas.map((m) => `    <meta ${m.attr}="${m.key}" content="${escAttr(m.content)}" />`),
  ].join('\n')
  const sorted = [...boroughMap.entries()].sort((a, b) => b[1].nights.length - a[1].nights.length)
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
    },
  }
})
