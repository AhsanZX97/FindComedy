import type { Page, Route } from '@playwright/test'
import type { MockUser, NightRow, ReviewRow } from './factories'

/**
 * A seedable, in-browser fake of the Supabase backend.
 *
 * Every Supabase REST/Auth call and every Nominatim geocode is intercepted in
 * the page, so no request ever reaches a real server. Combined with the dead
 * host in `.env.e2e`, this makes it impossible for E2E to touch production data.
 *
 * The mock holds in-memory tables per test (parallel-safe) and answers requests
 * the way PostgREST + GoTrue would:
 *  - GET with `Accept: …pgrst.object+json` (from `.single()`) returns a single
 *    object; otherwise an array (`.maybeSingle()` stays an array request and the
 *    client reshapes it itself).
 *  - Writes capture their payloads on `captured` so steps can assert what was sent.
 *
 * A single dispatching `/rest/v1/**` handler replaces the old layered-precedence
 * routes — it branches on the table name, so registration order no longer matters.
 */

export interface CapturedPayloads {
  submissions: Record<string, unknown>[]
  reports: Record<string, unknown>[]
  reviews: Record<string, unknown>[]
  favourites: Record<string, unknown>[]
  feedback: Record<string, unknown>[]
}

interface GeoStub {
  lat: string
  lon: string
  borough: string
}

const LONDON: GeoStub = { lat: '51.5390', lon: '-0.1426', borough: 'Camden' }
const OUTSIDE_LONDON: GeoStub = { lat: '53.4808', lon: '-2.2426', borough: 'Manchester' }

const STORAGE_KEY = 'sb-e2e-fake-auth-token'

function jsonRoute(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/** A structurally valid (unsigned) JWT — GoTrue never verifies it during getSession. */
function fakeJwt(user: MockUser, expSeconds: number): string {
  const enc = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  const header = enc({ alg: 'HS256', typ: 'JWT' })
  const payload = enc({
    sub: user.id,
    email: user.email,
    role: 'authenticated',
    aud: 'authenticated',
    exp: expSeconds,
    iat: Math.floor(Date.now() / 1000),
  })
  return `${header}.${payload}.e2e-signature`
}

function buildAuthUser(user: MockUser) {
  const now = new Date().toISOString()
  return {
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    email_confirmed_at: now,
    phone: '',
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: now,
    updated_at: now,
  }
}

function buildSession(user: MockUser) {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
  return {
    access_token: fakeJwt(user, expiresAt),
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 365,
    expires_at: expiresAt,
    user: buildAuthUser(user),
  }
}

export class SupabaseMock {
  readonly captured: CapturedPayloads = {
    submissions: [],
    reports: [],
    reviews: [],
    favourites: [],
    feedback: [],
  }

  private nightRows: NightRow[] = []
  private reviewRows: ReviewRow[] = []
  private reportRows: Record<string, unknown>[] = []
  private submissionRows: Record<string, unknown>[] = []
  private favouriteRows: { user_id: string; night_id: string }[] = []
  private profileRows: Record<string, unknown>[] = []
  private adminRows: { user_id: string }[] = []

  private geo: GeoStub = LONDON
  private signInUser: MockUser | null = null
  private nightsFail = false
  private seq = 0

  constructor(private readonly page: Page) {}

  // ---- seeding API (called from steps via the `seed` fixture) ----

  /** Replace the listings the browse/detail pages will load. */
  nights(rows: NightRow[]): this {
    this.nightRows = rows
    return this
  }

  /** Add a night, replacing any existing one with the same id (upsert semantics). */
  addNight(row: NightRow): this {
    const idx = this.nightRows.findIndex((n) => n.id === row.id)
    if (idx >= 0) this.nightRows[idx] = row
    else this.nightRows.push(row)
    return this
  }

  /** The route id (== slug) of a seeded night, so steps can open its detail page. */
  nightIdByName(name: string): string {
    const row = this.nightRows.find((n) => n.name === name)
    if (!row) throw new Error(`No seeded night named "${name}"`)
    return row.id
  }

  /** The id of a seeded submission, so steps can open its admin review page. */
  submissionIdByName(name: string): string {
    const row = this.submissionRows.find(
      (s) => (s.data as { name?: string } | undefined)?.name === name,
    )
    if (!row) throw new Error(`No seeded submission named "${name}"`)
    return row.id as string
  }

  /** The currently signed-in user, if any (steps need its id for favourites/reviews). */
  get currentUser(): MockUser | null {
    return this.signInUser
  }

  private reviewingName = ''

  /** Remember which submission an admin is reviewing (for later status assertions). */
  rememberReviewing(name: string): void {
    this.reviewingName = name
  }

  get reviewing(): string {
    return this.reviewingName
  }

  /** Seed reviews for a night (also feeds aggregate vibe tags). */
  reviews(rows: ReviewRow[]): this {
    this.reviewRows.push(...rows)
    return this
  }

  /** Mark a night as favourited by a user before the page loads. */
  favourite(userId: string, nightId: string): this {
    this.favouriteRows.push({ user_id: userId, night_id: nightId })
    return this
  }

  /** Seed a pending submission for the admin queue. */
  submission(row: { id: string; data: unknown; status?: string; submitter_note?: string }): this {
    this.submissionRows.push({
      id: row.id,
      data: row.data,
      status: row.status ?? 'pending',
      submitter_note: row.submitter_note ?? null,
      submitter_id: null,
      created_at: new Date().toISOString(),
    })
    return this
  }

  /** Make the next geocode resolve outside London (for the London-only guard). */
  geocodeOutsideLondon(): this {
    this.geo = OUTSIDE_LONDON
    return this
  }

  /** Make the listings request fail, so the browse/detail pages show an error. */
  failNights(): this {
    this.nightsFail = true
    return this
  }

  /**
   * Seed a signed-in session. Writes the GoTrue session into localStorage before
   * the app loads (via addInitScript) and registers the user's profile + admin
   * row so AuthContext resolves a real user. Must be called before navigation.
   */
  async signedInAs(user: MockUser): Promise<void> {
    this.signInUser = user
    this.profileRows.push({
      id: user.id,
      display_name: user.displayName,
      avatar_url: null,
      role: 'punter',
      created_at: new Date().toISOString(),
    })
    if (user.isAdmin) this.adminRows.push({ user_id: user.id })

    const session = buildSession(user)
    await this.page.addInitScript(
      ([key, value]) => {
        window.localStorage.setItem(key as string, value as string)
      },
      [STORAGE_KEY, JSON.stringify(session)] as const,
    )
  }

  // ---- route installation ----

  async install(): Promise<void> {
    // Keep the suite hermetic: drop external map tiles / marker assets so the
    // Leaflet map on the browse page never reaches the network.
    await this.page.route(
      /(tile\.openstreetmap\.org|unpkg\.com|cartocdn\.com|basemaps)/,
      (route) => route.abort(),
    )

    await this.page.route('**/nominatim.openstreetmap.org/**', (route) =>
      jsonRoute(route, 200, [
        { lat: this.geo.lat, lon: this.geo.lon, address: { borough: this.geo.borough } },
      ]),
    )

    await this.page.route('**/auth/v1/**', (route) => this.handleAuth(route))
    await this.page.route('**/rest/v1/**', (route) => this.handleRest(route))
  }

  // ---- auth (GoTrue) ----

  private handleAuth(route: Route): Promise<void> {
    const url = new URL(route.request().url())
    const path = url.pathname

    if (path.endsWith('/otp')) {
      // signInWithOtp — pretend the email was sent.
      return jsonRoute(route, 200, { data: { user: null, session: null }, error: null })
    }

    if (path.endsWith('/verify') || path.includes('/token')) {
      // verifyOtp / refresh — return a session for the email used (or seeded user).
      const body = safeJson(route.request().postData())
      const email = (body?.email as string) ?? this.signInUser?.email ?? 'comic@example.com'
      const user: MockUser = this.signInUser ?? {
        id: `user-${this.seq++}`,
        email,
        isAdmin: false,
        displayName: email.split('@')[0],
      }
      if (!this.profileRows.some((p) => p.id === user.id)) {
        this.profileRows.push({
          id: user.id,
          display_name: user.displayName,
          avatar_url: null,
          role: 'punter',
          created_at: new Date().toISOString(),
        })
      }
      return jsonRoute(route, 200, buildSession(user))
    }

    if (path.endsWith('/logout')) {
      return route.fulfill({ status: 204, body: '' })
    }

    if (path.endsWith('/user')) {
      const user = this.signInUser
      if (!user) return jsonRoute(route, 401, { message: 'not authenticated' })
      return jsonRoute(route, 200, buildAuthUser(user))
    }

    return jsonRoute(route, 200, {})
  }

  // ---- REST (PostgREST) ----

  private handleRest(route: Route): Promise<void> {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/').pop() ?? ''
    const method = request.method()
    const wantsObject = (request.headers()['accept'] ?? '').includes('pgrst.object')

    if (method === 'GET' && table === 'nights' && this.nightsFail) {
      return jsonRoute(route, 500, {
        message: 'Listings are temporarily unavailable.',
        code: '500',
      })
    }
    if (method === 'GET') return this.handleGet(route, table, url, wantsObject)
    if (method === 'POST') return this.handlePost(route, table, request.postData())
    if (method === 'PATCH') return this.handlePatch(route, table, url, request.postData())
    if (method === 'DELETE') return this.handleDelete(route, table, url)
    return jsonRoute(route, 200, [])
  }

  private rowsFor(table: string): Record<string, unknown>[] {
    switch (table) {
      case 'nights':
        return this.nightRows as unknown as Record<string, unknown>[]
      case 'reviews':
        return this.reviewRows as unknown as Record<string, unknown>[]
      case 'reports':
        return this.reportRows
      case 'submissions':
        return this.submissionRows
      case 'favourites':
        return this.favouriteRows as unknown as Record<string, unknown>[]
      case 'profiles':
        return this.profileRows
      case 'admins':
        return this.adminRows as unknown as Record<string, unknown>[]
      default:
        return []
    }
  }

  /** Apply `column=eq.value` query filters the way PostgREST does. */
  private applyFilters(
    rows: Record<string, unknown>[],
    url: URL,
  ): Record<string, unknown>[] {
    let result = rows
    for (const [key, value] of url.searchParams.entries()) {
      if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(key)) continue
      if (value.startsWith('eq.')) {
        const expected = value.slice(3)
        result = result.filter((r) => String(r[key]) === expected)
      }
    }
    return result
  }

  private handleGet(
    route: Route,
    table: string,
    url: URL,
    wantsObject: boolean,
  ): Promise<void> {
    const matches = this.applyFilters(this.rowsFor(table), url)
    if (wantsObject) {
      if (matches.length === 0) {
        return jsonRoute(route, 406, {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
        })
      }
      return jsonRoute(route, 200, matches[0])
    }
    return jsonRoute(route, 200, matches)
  }

  private handlePost(route: Route, table: string, rawBody: string | null): Promise<void> {
    const body = safeJson(rawBody)
    const created = this.insert(table, body)
    return jsonRoute(route, 201, [created])
  }

  private insert(table: string, body: Record<string, unknown> | null): Record<string, unknown> {
    const payload = body ?? {}
    const now = new Date().toISOString()
    const id = `e2e-${table}-${this.seq++}`

    switch (table) {
      case 'submissions': {
        this.captured.submissions.push(payload)
        const row = { id, status: 'pending', created_at: now, ...payload }
        this.submissionRows.push(row)
        return row
      }
      case 'reports': {
        this.captured.reports.push(payload)
        const row = { id, resolved_at: null, created_at: now, ...payload }
        this.reportRows.push(row)
        return row
      }
      case 'reviews': {
        this.captured.reviews.push(payload)
        // upsert on (user_id, night_id)
        const existing = this.reviewRows.find(
          (r) => r.user_id === payload.user_id && r.night_id === payload.night_id,
        )
        if (existing) {
          Object.assign(existing, payload)
          return existing as unknown as Record<string, unknown>
        }
        const row = {
          id,
          display_name: '',
          note: null,
          tags: [],
          created_at: now,
          ...payload,
        } as unknown as ReviewRow
        this.reviewRows.push(row)
        return row as unknown as Record<string, unknown>
      }
      case 'favourites': {
        this.captured.favourites.push(payload)
        const row = { user_id: payload.user_id as string, night_id: payload.night_id as string }
        this.favouriteRows.push(row)
        return row
      }
      case 'feedback': {
        this.captured.feedback.push(payload)
        return { id, created_at: now, ...payload }
      }
      case 'nights': {
        const row = { ...payload } as unknown as NightRow
        const idx = this.nightRows.findIndex((n) => n.id === row.id)
        if (idx >= 0) this.nightRows[idx] = row
        else this.nightRows.push(row)
        return payload
      }
      default:
        return { id, ...payload }
    }
  }

  private handlePatch(
    route: Route,
    table: string,
    url: URL,
    rawBody: string | null,
  ): Promise<void> {
    const patch = safeJson(rawBody) ?? {}
    const matches = this.applyFilters(this.rowsFor(table), url)
    for (const row of matches) Object.assign(row, patch)
    return jsonRoute(route, 200, matches)
  }

  private handleDelete(route: Route, table: string, url: URL): Promise<void> {
    const rows = this.rowsFor(table)
    const matches = this.applyFilters(rows, url)
    const remaining = rows.filter((r) => !matches.includes(r))
    this.replaceRows(table, remaining)
    return jsonRoute(route, 200, [])
  }

  private replaceRows(table: string, rows: Record<string, unknown>[]): void {
    switch (table) {
      case 'reviews':
        this.reviewRows = rows as unknown as ReviewRow[]
        break
      case 'reports':
        this.reportRows = rows
        break
      case 'favourites':
        this.favouriteRows = rows as unknown as { user_id: string; night_id: string }[]
        break
      case 'nights':
        this.nightRows = rows as unknown as NightRow[]
        break
      default:
        break
    }
  }
}

function safeJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}
