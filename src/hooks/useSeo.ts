import { useEffect } from 'react'
import { buildSeoTags } from '../utils/seoTags'

/** Absolute origin of the deployed site, used for canonical and og:url. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://www.findcomedy.xyz').replace(/\/$/, '')

export interface SeoOptions {
  /** Page title — also used as og:title. */
  title: string
  description?: string
  /** Path used for canonical + og:url. Defaults to the current location pathname. */
  path?: string
  /** Absolute or root-relative image URL for social cards. */
  image?: string
  type?: 'website' | 'article'
  /** Schema.org structured data injected as a JSON-LD <script>. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(attr: 'name' | 'property', key: string): void {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove()
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(data: SeoOptions['jsonLd']): void {
  const id = 'seo-jsonld'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/**
 * Sets per-route document head tags for SEO and social sharing: title, meta
 * description, canonical link, Open Graph + Twitter cards, and optional JSON-LD.
 * Re-runs whenever the provided values change.
 */
export function useSeo({ title, description, path, image, type = 'website', jsonLd }: SeoOptions): void {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const { canonical, metas, jsonLd: ld } = buildSeoTags({
      title,
      description,
      baseUrl: SITE_URL,
      path: path ?? window.location.pathname,
      image,
      type,
      jsonLd,
    })

    document.title = title
    upsertCanonical(canonical)
    metas.forEach((m) => upsertMeta(m.attr, m.key, m.content))

    // Clear image tags the current page doesn't set, so a previous route's image never lingers.
    const present = new Set(metas.map((m) => `${m.attr}|${m.key}`))
    if (!present.has('property|og:image')) removeMeta('property', 'og:image')
    if (!present.has('name|twitter:image')) removeMeta('name', 'twitter:image')

    upsertJsonLd(ld)
    // jsonLdKey captures structured-data changes without re-running on object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, type, jsonLdKey])
}
