import { expect } from '@playwright/test'
import { test as base, createBdd } from 'playwright-bdd'
import { SupabaseMock, type CapturedPayloads } from './supabase-mock'
import { BrowsePage } from '../pages/BrowsePage'
import { NightDetailPage } from '../pages/NightDetailPage'
import { SubmitPage } from '../pages/SubmitPage'
import { SignInPage } from '../pages/SignInPage'
import { MyNightsPage } from '../pages/MyNightsPage'
import { AreaPage } from '../pages/AreaPage'
import { SubmissionQueuePage } from '../pages/admin/SubmissionQueuePage'

/**
 * Test fixtures, injected into steps via destructuring (the playwright-bdd way).
 *
 *  - `seed`     — the seedable Supabase mock; scenarios declare the world they need.
 *  - `captured` — payloads of every write, so steps can assert what was sent.
 *  - page objects — lazily constructed per test; steps orchestrate these, never
 *    raw locators.
 *
 * The mock installs all routes automatically (`supabaseMock`, auto), so no spec
 * can reach a real backend.
 */
interface Fixtures {
  seed: SupabaseMock
  captured: CapturedPayloads
  supabaseMock: void
  browsePage: BrowsePage
  nightDetailPage: NightDetailPage
  submitPage: SubmitPage
  signInPage: SignInPage
  myNightsPage: MyNightsPage
  areaPage: AreaPage
  submissionQueuePage: SubmissionQueuePage
}

export const test = base.extend<Fixtures>({
  seed: async ({ page }, use) => {
    await use(new SupabaseMock(page))
  },

  captured: async ({ seed }, use) => {
    await use(seed.captured)
  },

  supabaseMock: [
    async ({ seed }, use) => {
      await seed.install()
      await use()
    },
    { auto: true },
  ],

  browsePage: async ({ page }, use) => {
    await use(new BrowsePage(page))
  },
  nightDetailPage: async ({ page }, use) => {
    await use(new NightDetailPage(page))
  },
  submitPage: async ({ page }, use) => {
    await use(new SubmitPage(page))
  },
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page))
  },
  myNightsPage: async ({ page }, use) => {
    await use(new MyNightsPage(page))
  },
  areaPage: async ({ page }, use) => {
    await use(new AreaPage(page))
  },
  submissionQueuePage: async ({ page }, use) => {
    await use(new SubmissionQueuePage(page))
  },
})

export { expect }
export const { Given, When, Then } = createBdd(test)
