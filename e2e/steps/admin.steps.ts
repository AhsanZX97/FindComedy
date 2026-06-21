import { Given, When, Then, expect } from '../support/fixtures'
import { slugify } from '../../src/utils/slug'

Given('a night {string} is awaiting review', async ({ seed }, name: string) => {
  seed.submission({
    id: slugify(name),
    data: {
      name,
      description: 'A night awaiting review.',
      type: 'open-mic',
      levels: [],
      bringerRequired: false,
      schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }],
      venueName: 'The Test Tavern',
      venueAddress: '100 Camden High St, London NW1 0LU',
    },
  })
})

When('I open the submission queue', async ({ submissionQueuePage }) => {
  await submissionQueuePage.open()
})

Given('I am reviewing {string}', async ({ submissionQueuePage, seed }, name: string) => {
  seed.rememberReviewing(name)
  await submissionQueuePage.openReview(seed.submissionIdByName(name))
})

When('I approve it', async ({ submissionQueuePage }) => {
  await submissionQueuePage.approve()
})

When('I reject it', async ({ submissionQueuePage }) => {
  await submissionQueuePage.reject()
})

Then('I should see {string} awaiting review', async ({ submissionQueuePage }, name: string) => {
  await expect(submissionQueuePage.queueItem(name)).toBeVisible()
})

Then('it should be marked approved', async ({ submissionQueuePage, seed }) => {
  await submissionQueuePage.filterTo('all')
  await expect(submissionQueuePage.statusBadge(seed.reviewing)).toHaveText('approved')
})

Then('it should be marked rejected', async ({ submissionQueuePage, seed }) => {
  await submissionQueuePage.filterTo('all')
  await expect(submissionQueuePage.statusBadge(seed.reviewing)).toHaveText('rejected')
})
