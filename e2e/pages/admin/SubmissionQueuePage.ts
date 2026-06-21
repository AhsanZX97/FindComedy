import type { Locator } from '@playwright/test'
import { BasePage } from '../BasePage'

/**
 * The admin submission queue (`/admin/queue`) and the per-submission review page
 * (`/admin/queue/:id`). Behind `RequireAdmin`, so the test must seed an admin
 * session first.
 */
export class SubmissionQueuePage extends BasePage {
  async open(): Promise<void> {
    await this.goto('/admin/queue')
    await this.page
      .getByRole('heading', { name: 'Submission queue' })
      .waitFor({ state: 'visible' })
  }

  async filterTo(status: string): Promise<void> {
    await this.page.getByRole('button', { name: status, exact: true }).click()
  }

  queueItem(name: string): Locator {
    return this.page.getByRole('heading', { level: 3, name })
  }

  /** A submission's status badge (e.g. "approved", "rejected") within its card. */
  statusBadge(name: string): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.queueItem(name) })
      .filter({ hasText: /pending|approved|rejected/ })
      .last()
      .getByText(/^(pending|approved|rejected)$/)
  }

  async openSubmission(name: string): Promise<void> {
    await this.page.getByRole('link').filter({ has: this.queueItem(name) }).click()
    await this.page.getByRole('heading', { level: 1, name }).waitFor({ state: 'visible' })
  }

  /** Open a submission's review page directly by id. */
  async openReview(id: string): Promise<void> {
    await this.goto(`/admin/queue/${id}`)
    await this.page.getByRole('button', { name: /Approve & publish|Reject/ }).first().waitFor({ state: 'visible' })
  }

  async approve(): Promise<void> {
    await this.page.getByRole('button', { name: 'Approve & publish' }).click()
    await this.page.waitForURL((url) => url.pathname === '/admin/queue')
  }

  async reject(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reject' }).click()
    await this.page.waitForURL((url) => url.pathname === '/admin/queue')
  }
}
