const SITE_NAME = 'FindComedy'

export interface MetaTag {
  attr: 'name' | 'property'
  key: string
  content: string
}

export interface SeoTagData {
  title: string
  canonical: string
  metas: MetaTag[]
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export interface BuildSeoOptions {
  title: string
  description?: string
  /** Absolute origin, no trailing slash. */
  baseUrl: string
  /** Root-relative path, e.g. "/night/comedy-virgins-stockwell". */
  path: string
  /** Absolute or root-relative social image URL. */
  image?: string
  type?: 'website' | 'article'
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Pure builder for a page's SEO/social tag set (title, canonical, Open Graph +
 * Twitter metas, JSON-LD). Shared by the runtime `useSeo` hook and the build-time
 * prerenderer so the hydrated DOM and the static HTML never drift apart.
 */
export function buildSeoTags(opts: BuildSeoOptions): SeoTagData {
  const { title, description, baseUrl, path, image, type = 'website', jsonLd } = opts
  const canonical = baseUrl + path
  const absImage = image ? (image.startsWith('http') ? image : baseUrl + image) : undefined

  const metas: MetaTag[] = []
  if (description) metas.push({ attr: 'name', key: 'description', content: description })

  metas.push({ attr: 'property', key: 'og:site_name', content: SITE_NAME })
  metas.push({ attr: 'property', key: 'og:type', content: type })
  metas.push({ attr: 'property', key: 'og:title', content: title })
  metas.push({ attr: 'property', key: 'og:url', content: canonical })
  if (description) metas.push({ attr: 'property', key: 'og:description', content: description })
  if (absImage) metas.push({ attr: 'property', key: 'og:image', content: absImage })

  metas.push({ attr: 'name', key: 'twitter:card', content: absImage ? 'summary_large_image' : 'summary' })
  metas.push({ attr: 'name', key: 'twitter:title', content: title })
  if (description) metas.push({ attr: 'name', key: 'twitter:description', content: description })
  if (absImage) metas.push({ attr: 'name', key: 'twitter:image', content: absImage })

  return { title, canonical, metas, jsonLd }
}
