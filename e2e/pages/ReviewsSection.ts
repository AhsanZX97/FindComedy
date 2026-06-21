import type { Page, Locator } from '@playwright/test'

/**
 * The "Vibes" reviews section on a night detail page. A component object owned
 * by NightDetailPage (`nightDetailPage.reviews`).
 */
export class ReviewsSection {
  constructor(private readonly page: Page) {}

  private cta(): Locator {
    return this.page.getByRole('button', { name: /Leave a vibe check|Edit your review/ })
  }

  /** Click the CTA — when signed out this triggers the auth redirect. */
  async tryLeaveVibeCheck(): Promise<void> {
    await this.cta().click()
  }

  async openForm(): Promise<void> {
    await this.cta().click()
  }

  private tagButton(label: string): Locator {
    return this.page.getByRole('button', { name: label, exact: true })
  }

  async leaveVibeCheck(tags: string[]): Promise<void> {
    await this.openForm()
    for (const tag of tags) await this.tagButton(tag).click()
    await this.page.getByRole('button', { name: 'Save' }).click()
  }

  isSaveDisabled(): Promise<boolean> {
    return this.page.getByRole('button', { name: 'Save' }).isDisabled()
  }

  /** An aggregate "top vibe" pill summarising the crowd's tags. */
  topVibe(label: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${label}`) }).first()
  }
}
