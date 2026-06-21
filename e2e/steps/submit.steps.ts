import { DataTable } from 'playwright-bdd'
import { Given, When, Then, expect } from './fixtures'

// Field name (from the feature's data table) → the input's placeholder text.
// The form's <label>s aren't wired to inputs via htmlFor, so we target by placeholder.
const PLACEHOLDERS: Record<string, string> = {
  name: 'e.g. Knock2Bag',
  about: 'What makes this night special?',
  venue: 'e.g. The Camden Head',
  address: 'e.g. 100 Camden High St, London NW1 0LU',
}

Given('I am on the submit page', async ({ page }) => {
  await page.goto('/submit')
  await expect(page.getByRole('heading', { name: 'Submit a comedy night' })).toBeVisible()
})

When('I fill in the night details', async ({ page }, table: DataTable) => {
  for (const { field, value } of table.hashes()) {
    const placeholder = PLACEHOLDERS[field]
    if (!placeholder) throw new Error(`Unknown field "${field}" in scenario data table`)
    await page.getByPlaceholder(placeholder).fill(value)
  }
})

When('I submit the night', async ({ page }) => {
  await page.getByRole('button', { name: 'Submit night for review' }).click()
})

Then('I see the submission confirmation', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Night submitted!' })).toBeVisible()
})

Then(
  'the submission sent to the backend has the name {string}',
  async ({ captured }, expectedName: string) => {
    expect(captured.submissions).toHaveLength(1)
    const data = captured.submissions[0].data as { name?: string }
    expect(data.name).toBe(expectedName)
  },
)
