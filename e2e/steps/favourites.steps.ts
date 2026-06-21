import { Given, When, Then, expect } from '../support/fixtures'

When('I try to favourite it', async ({ nightDetailPage }) => {
  await nightDetailPage.tryFavourite()
})

Given('I have favourited {string}', async ({ seed }, name: string) => {
  const user = seed.currentUser
  if (!user) throw new Error('No signed-in user — add "Given I am signed in" first')
  seed.favourite(user.id, seed.nightIdByName(name))
})

Then('I should see {string} in my favourites', async ({ myNightsPage }, name: string) => {
  await expect(myNightsPage.favourite(name)).toBeVisible()
})

Then('I should see a prompt to favourite a night', async ({ myNightsPage }) => {
  await expect(myNightsPage.emptyPrompt()).toBeVisible()
})
