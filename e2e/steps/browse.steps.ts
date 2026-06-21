import type { DataTable } from 'playwright-bdd'
import { Given, When, Then, expect } from '../support/fixtures'
import { nightFactory } from '../support/factories'
import type { NightType, Level, Weekday } from '../../src/types/comedyNight'

const SHORT_DAY: Record<string, Weekday> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const FULL_WEEKDAYS = new Set([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
])

// ── Seeding listings ──────────────────────────────────────────────────────────

Given('the listings include:', async ({ seed }, table: DataTable) => {
  for (const row of table.hashes()) {
    seed.addNight(
      nightFactory({
        name: row.name,
        // Neutral venue name so a search term doesn't cross-match other rows
        // (the factory default "The Camden Head" would leak "Camden" everywhere).
        venueName: `${row.name} venue`,
        type: row.type as NightType,
        weekday: SHORT_DAY[row.day] ?? 1,
        levels: row.level ? [row.level as Level] : ['new'],
        bringer: row.bringer === 'yes',
        area: row.area,
      }),
    )
  }
})

Given('the listings service is unavailable', async ({ seed }) => {
  seed.failNights()
})

Given('there are no listings', async ({ seed }) => {
  seed.nights([])
})

// ── Filtering ─────────────────────────────────────────────────────────────────

When('I search for {string}', async ({ browsePage }, term: string) => {
  await browsePage.filters.search(term)
})

async function filterTo(browsePage: { filters: { filterToDay: (d: string) => Promise<void>; filterToType: (t: string) => Promise<void> } }, value: string) {
  if (FULL_WEEKDAYS.has(value)) await browsePage.filters.filterToDay(value)
  else await browsePage.filters.filterToType(value)
}

When('I filter to {string} nights', async ({ browsePage }, value: string) => {
  await filterTo(browsePage, value)
})

Given('I have filtered to {string} nights', async ({ browsePage }, value: string) => {
  await filterTo(browsePage, value)
})

When('I hide nights that require a bringer', async ({ browsePage }) => {
  await browsePage.filters.hideBringer()
})

When('I filter to the {string} area', async ({ browsePage }, area: string) => {
  await browsePage.filters.filterToArea(area)
})

When('I clear all filters', async ({ browsePage }) => {
  await browsePage.filters.clearAll()
})

// ── Assertions ────────────────────────────────────────────────────────────────

Then('I should see {int} nights', async ({ browsePage }, count: number) => {
  await expect.poll(async () => (await browsePage.visibleNightNames()).length).toBe(count)
})

Then('I should see an error message instead of listings', async ({ browsePage }) => {
  await expect(browsePage.errorMessage()).toBeVisible()
})
