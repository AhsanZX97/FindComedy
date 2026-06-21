import type { DataTable } from 'playwright-bdd'
import { Given, When, Then, expect } from '../support/fixtures'

Given('I am on the submit page', async ({ submitPage }) => {
  await submitPage.open()
})

Given('the venue address resolves outside London', async ({ seed }) => {
  seed.geocodeOutsideLondon()
})

When('I fill in the night details:', async ({ submitPage }, table: DataTable) => {
  await submitPage.fill(table.hashes())
})

When('I submit the night', async ({ submitPage }) => {
  await submitPage.submit()
})

When('I submit the night without filling required details', async ({ submitPage }) => {
  await submitPage.submit()
})

Then('I see the submission confirmation', async ({ submitPage }) => {
  await expect(submitPage.confirmation()).toBeVisible()
})

Then(
  'the submission received by the team is named {string}',
  async ({ captured }, expectedName: string) => {
    expect(captured.submissions).toHaveLength(1)
    const data = captured.submissions[0].data as { name?: string }
    expect(data.name).toBe(expectedName)
  },
)

Then('I should be told which details are required', async ({ submitPage }) => {
  expect(await submitPage.nameFieldIsInvalid()).toBe(true)
})

Then('no submission is sent to the team', async ({ captured }) => {
  expect(captured.submissions).toHaveLength(0)
})

Then('I should be told the night must be in London', async ({ submitPage }) => {
  await expect(submitPage.londonError()).toBeVisible()
})
