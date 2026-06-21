import type { DataTable } from 'playwright-bdd'
import { Given, When, Then, expect } from '../support/fixtures'
import { nightFactory, daysAgo } from '../support/factories'
import type { NightType } from '../../src/types/comedyNight'

// ── Seeding a richly-described night (vertical table) ─────────────────────────

Given('a night exists:', async ({ seed }, table: DataTable) => {
  const row = table.rowsHash()
  seed.addNight(
    nightFactory({
      name: row.name,
      venueName: row.venue,
      address: row.address,
      type: (row.type as NightType) ?? 'open-mic',
      bringer: row.bringer === 'yes',
    }),
  )
})

// Re-seed the named night with a specific trait. addNight upserts by id, so this
// replaces the background's night — keeping scenarios declarative.
Given('the night {string} requires a bringer', async ({ seed }, name: string) => {
  seed.addNight(nightFactory({ name, bringer: true, bringerCount: 1 }))
})

Given(
  'the night {string} was last verified over a year ago',
  async ({ seed }, name: string) => {
    seed.addNight(nightFactory({ name, lastVerified: daysAgo(400) }))
  },
)

Given('the night {string} is no longer running', async ({ seed }, name: string) => {
  seed.addNight(nightFactory({ name, status: 'gone' }))
})

// ── Opening ───────────────────────────────────────────────────────────────────

When('I open the night {string}', async ({ browsePage }, name: string) => {
  await browsePage.openNight(name)
})

When('I open a night that does not exist', async ({ nightDetailPage }) => {
  await nightDetailPage.open('no-such-night-anywhere')
})

// ── Assertions ──────────────────────────────────────────────────────────────

Then('I should see its venue {string}', async ({ nightDetailPage }, venue: string) => {
  await expect(nightDetailPage.venue(venue)).toBeVisible()
})

Then('I should see how to attend', async ({ nightDetailPage }) => {
  await expect(nightDetailPage.howToAttendHeading()).toBeVisible()
})

Then('I should see that a bringer is required', async ({ nightDetailPage }) => {
  await expect(nightDetailPage.bringerRequiredChip()).toBeVisible()
})

Then('I should see that no bringer is required', async ({ nightDetailPage }) => {
  await expect(nightDetailPage.noBringerChip()).toBeVisible()
})

Then('I should see a freshness warning', async ({ nightDetailPage }) => {
  await expect(nightDetailPage.freshnessWarning()).toBeVisible()
})

Then('I should see that it is no longer running', async ({ nightDetailPage }) => {
  await expect(nightDetailPage.noLongerRunningBadge()).toBeVisible()
})

Then('I should be offered directions to the venue', async ({ nightDetailPage }) => {
  await expect(nightDetailPage.directionsLink()).toBeVisible()
})

// ── Report ("Request update") ─────────────────────────────────────────────────

When('I try to report it', async ({ nightDetailPage }) => {
  await nightDetailPage.tryReport()
})

When('I report it as having the wrong time', async ({ nightDetailPage }) => {
  await nightDetailPage.reportAs('wrong-time')
  await expect(nightDetailPage.reportConfirmation()).toBeVisible()
})

Then(
  'the report received by the team is for {string}',
  async ({ captured, seed }, name: string) => {
    expect(captured.reports).toHaveLength(1)
    expect(captured.reports[0].night_id).toBe(seed.nightIdByName(name))
  },
)
