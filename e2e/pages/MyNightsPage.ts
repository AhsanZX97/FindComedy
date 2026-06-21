import type { Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/** The signed-in "My nights" page (route `/my`; redirects to /auth when signed out). */
export class MyNightsPage extends BasePage {
  async open(): Promise<void> {
    await this.goto('/my')
  }

  favourite(name: string): Locator {
    return this.page.getByRole('heading', { level: 2, name })
  }

  emptyPrompt(): Locator {
    return this.page.getByText(/tap ♡ on any night to save it/i)
  }

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'My nights' })
  }
}
