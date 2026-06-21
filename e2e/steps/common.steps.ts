import { Given, When, Then, expect } from '../support/fixtures'
import { nightFactory, userFactory } from '../support/factories'

// ── Sessions ────────────────────────────────────────────────────────────────

Given('I am a signed-out visitor', async () => {
  // Default state — no session is seeded. Explicit for readable scenarios.
})

Given('I am signed in', async ({ seed }) => {
  await seed.signedInAs(userFactory())
})

Given('I am signed in as an admin', async ({ seed }) => {
  await seed.signedInAs(userFactory({ isAdmin: true }))
})

// ── Seeding a single night ──────────────────────────────────────────────────

Given('a night {string} exists', async ({ seed }, name: string) => {
  seed.addNight(nightFactory({ name }))
})

// ── Navigation ──────────────────────────────────────────────────────────────

Given('I am browsing nights', async ({ browsePage }) => {
  await browsePage.open()
})

When('I open the browse page', async ({ browsePage }) => {
  await browsePage.open()
})

When('I view {string}', async ({ nightDetailPage, seed }, name: string) => {
  await nightDetailPage.open(seed.nightIdByName(name))
})

Given('I am viewing {string}', async ({ nightDetailPage, seed }, name: string) => {
  await nightDetailPage.open(seed.nightIdByName(name))
})

When('I open my nights', async ({ myNightsPage }) => {
  await myNightsPage.open()
})

// ── Shared assertions ───────────────────────────────────────────────────────

Then('I should be taken to the sign-in page', async ({ page }) => {
  await page.waitForURL((url) => url.pathname === '/auth')
  expect(new URL(page.url()).pathname).toBe('/auth')
})

Then('I should be returned to the browse page', async ({ page }) => {
  await page.waitForURL((url) => url.pathname === '/')
  expect(new URL(page.url()).pathname).toBe('/')
})

Then('I should land on my nights', async ({ page, myNightsPage }) => {
  await page.waitForURL((url) => url.pathname === '/my')
  await expect(myNightsPage.heading()).toBeVisible()
})

Then('I should see {string}', async ({ browsePage }, name: string) => {
  await expect.poll(() => browsePage.visibleNightNames()).toContain(name)
})

Then('I should not see {string}', async ({ browsePage }, name: string) => {
  await expect.poll(() => browsePage.visibleNightNames()).not.toContain(name)
})

Then(
  'I should see a message that no nights match my filters',
  async ({ browsePage }) => {
    await expect(browsePage.noMatchesMessage()).toBeVisible()
  },
)
