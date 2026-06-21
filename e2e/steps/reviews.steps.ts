import { Given, When, Then, expect } from '../support/fixtures'
import { reviewFactory } from '../support/factories'
import { ALL_VIBE_TAGS, VIBE_TAG_LABELS } from '../../src/types/comedyNight'
import type { VibeTag } from '../../src/types/comedyNight'

function tagIdFromLabel(label: string): VibeTag {
  const tag = ALL_VIBE_TAGS.find((t) => VIBE_TAG_LABELS[t] === label)
  if (!tag) throw new Error(`Unknown vibe tag "${label}"`)
  return tag
}

When('I try to leave a vibe check', async ({ nightDetailPage }) => {
  await nightDetailPage.reviews.tryLeaveVibeCheck()
})

When(
  'I leave a vibe check tagged {string} and {string}',
  async ({ nightDetailPage }, first: string, second: string) => {
    await nightDetailPage.reviews.leaveVibeCheck([first, second])
  },
)

When('I open the vibe-check form without choosing a tag', async ({ nightDetailPage }) => {
  await nightDetailPage.reviews.openForm()
})

Then('my vibe check should appear on the night', async ({ nightDetailPage }) => {
  await expect(nightDetailPage.reviews.topVibe('Friendly host')).toBeVisible()
})

Then('I should not be able to save it', async ({ nightDetailPage }) => {
  expect(await nightDetailPage.reviews.isSaveDisabled()).toBe(true)
})

Given(
  '{string} has reviews tagging it {string} three times',
  async ({ seed }, name: string, label: string) => {
    const nightId = seed.nightIdByName(name)
    const tag = tagIdFromLabel(label)
    seed.reviews([
      reviewFactory({ nightId, tags: [tag], userId: 'u1' }),
      reviewFactory({ nightId, tags: [tag], userId: 'u2' }),
      reviewFactory({ nightId, tags: [tag], userId: 'u3' }),
    ])
  },
)

Then('{string} should be shown as a top vibe', async ({ nightDetailPage }, label: string) => {
  await expect(nightDetailPage.reviews.topVibe(label)).toBeVisible()
})
