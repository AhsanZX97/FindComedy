import type { Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { ReviewsSection } from './ReviewsSection'

/** Report reasons as shown in the "Request update" modal (see REPORT_TYPE_LABELS). */
const REPORT_LABELS: Record<string, string> = {
  'no-longer-running': 'Night is no longer running',
  'wrong-time': 'Wrong time or day',
  'wrong-venue': 'Wrong venue or address',
  'wrong-info': 'Other info is wrong',
  other: 'Something else',
}

/**
 * A single night's detail page (route `/night/:id`). Opened by id/slug, since
 * the route resolves either. Pure interaction — the id is supplied by the step
 * (which knows it from the seeded data).
 */
export class NightDetailPage extends BasePage {
  readonly reviews = new ReviewsSection(this.page)

  async open(idOrSlug: string): Promise<void> {
    await this.goto(`/night/${idOrSlug}`)
    await this.page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  }

  venue(name: string): Locator {
    return this.page.getByText(name, { exact: true })
  }

  howToAttendHeading(): Locator {
    return this.page.getByRole('heading', { name: 'How to attend' })
  }

  bringerRequiredChip(): Locator {
    return this.page.getByText(/^Bringer( · \d+)?$/)
  }

  noBringerChip(): Locator {
    return this.page.getByText('No bringer', { exact: true })
  }

  freshnessWarning(): Locator {
    return this.page.getByText(/⚠️/)
  }

  noLongerRunningBadge(): Locator {
    return this.page.getByText('No longer running')
  }

  directionsLink(): Locator {
    return this.page.getByRole('link', { name: 'Get me there' })
  }

  // ---- favourite ----

  async tryFavourite(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add to favourites' }).first().click()
  }

  // ---- report ("Request update") ----

  async tryReport(): Promise<void> {
    await this.page.getByRole('button', { name: 'Request update' }).click()
  }

  async reportAs(reportType: string): Promise<void> {
    await this.tryReport()
    const label = REPORT_LABELS[reportType] ?? reportType
    await this.page.getByRole('radio', { name: label }).check()
    await this.page.getByRole('button', { name: 'Send request' }).click()
  }

  reportConfirmation(): Locator {
    return this.page.getByText('Thanks for your request!')
  }
}
