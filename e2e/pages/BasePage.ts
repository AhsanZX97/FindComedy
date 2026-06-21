import type { Page } from '@playwright/test'

/**
 * Shared base for every Page Object. POMs are pure interaction — no test data,
 * no mocking (that's the fixture's job).
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to an in-app path (relative to baseURL). */
  protected async goto(path: string): Promise<void> {
    await this.page.goto(path)
  }
}
