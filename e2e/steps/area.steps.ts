import { Given, When, Then, expect } from '../support/fixtures'
import { nightFactory } from '../support/factories'
import { slugify } from '../../src/utils/slug'

Given(
  'the listings include a night {string} in {string}',
  async ({ seed }, name: string, area: string) => {
    seed.addNight(nightFactory({ name, area }))
  },
)

When('I open the areas index', async ({ areaPage }) => {
  await areaPage.openIndex()
})

When('I open the {string} area page', async ({ areaPage }, area: string) => {
  await areaPage.openArea(slugify(area))
})

Then('I should see {string} listed', async ({ areaPage }, area: string) => {
  await expect(areaPage.areaLink(area)).toBeVisible()
})
