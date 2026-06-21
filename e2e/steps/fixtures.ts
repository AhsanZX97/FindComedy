import { expect } from '@playwright/test'
import { test as base, createBdd } from 'playwright-bdd'

interface Captured {
  // Bodies of every POST to /rest/v1/submissions, so steps can assert what was sent.
  submissions: Record<string, unknown>[]
}

/**
 * Every spec runs with all Supabase + Nominatim traffic intercepted in the browser,
 * so no request ever reaches a real backend. Combined with the dead host in
 * .env.e2e, this makes it impossible for E2E to touch production data.
 *
 * Note on precedence: Playwright runs route handlers in reverse registration order,
 * so the broad `/rest/v1/**` catch-all is registered first and the specific
 * `submissions` handler last — the specific one wins.
 */
export const test = base.extend<{ captured: Captured; supabaseMock: void }>({
  captured: async ({}, use) => {
    await use({ submissions: [] })
  },

  supabaseMock: [
    async ({ page, captured }, use) => {
      // Geocoding: return a fixed London coordinate so isLondonCoord() passes.
      await page.route('**/nominatim.openstreetmap.org/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { lat: '51.5390', lon: '-0.1426', address: { borough: 'Camden' } },
          ]),
        }),
      )

      // Catch-all for any Supabase REST/Auth call (e.g. listings, session) → empty.
      await page.route('**/rest/v1/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
      )
      await page.route('**/auth/v1/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
      )

      // The submission insert: capture the payload, return a created row.
      await page.route('**/rest/v1/submissions*', (route) => {
        if (route.request().method() === 'POST') {
          captured.submissions.push(route.request().postDataJSON())
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'e2e-submission', status: 'pending' }]),
          })
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      })

      await use()
    },
    { auto: true },
  ],
})

export { expect }
export const { Given, When, Then } = createBdd(test)
