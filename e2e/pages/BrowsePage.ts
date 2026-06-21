import type { Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { FilterBar } from './FilterBar'

/**
 * The browse / listings page (route `/`). Night names render as level-2
 * headings inside cards; navigation to a night is the card's
 * "View full night" link.
 */
export class BrowsePage extends BasePage {
  readonly filters = new FilterBar(this.page)

  async open(): Promise<void> {
    await this.goto('/')
    await this.waitForSettled()
  }

  /** Wait until listings have either rendered or resolved to empty/error. */
  private async waitForSettled(): Promise<void> {
    await this.page
      .getByRole('heading', { level: 2 })
      .first()
      .or(this.page.getByText('No nights match your filters.'))
      .or(this.errorMessage())
      .first()
      .waitFor({ state: 'visible' })
      .catch(() => {})
  }

  private nightHeading(name: string): Locator {
    return this.page.getByRole('heading', { level: 2, name })
  }

  /** The card container holding a given night (scopes per-card actions). */
  private cardFor(name: string): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.nightHeading(name) })
      .filter({ has: this.page.getByRole('link', { name: 'View full night' }) })
      .last()
  }

  async openNight(name: string): Promise<void> {
    await this.cardFor(name).getByRole('link', { name: 'View full night' }).click()
  }

  isNightVisible(name: string): Promise<boolean> {
    return this.nightHeading(name).isVisible()
  }

  nightHeadingCount(name: string): Promise<number> {
    return this.nightHeading(name).count()
  }

  async visibleNightNames(): Promise<string[]> {
    return this.page.getByRole('heading', { level: 2 }).allInnerTexts()
  }

  noMatchesMessage(): Locator {
    return this.page.getByText('No nights match your filters.')
  }

  errorMessage(): Locator {
    return this.page.getByText(/unavailable/i)
  }
}
