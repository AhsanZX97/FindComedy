import type { Page } from '@playwright/test'

/** Maps a full weekday name (used in scenarios) to the pill label in the UI. */
const DAY_PILL: Record<string, string> = {
  Sunday: 'Sun',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
}

/**
 * The browse filter bar — a component object owned by BrowsePage
 * (`browsePage.filters`). The only place the filter selectors live.
 */
export class FilterBar {
  constructor(private readonly page: Page) {}

  async search(term: string): Promise<void> {
    await this.page.getByPlaceholder('Search nights, venues, areas...').fill(term)
  }

  async filterToDay(dayName: string): Promise<void> {
    const label = DAY_PILL[dayName] ?? dayName
    await this.page.getByRole('button', { name: label, exact: true }).click()
  }

  async filterToType(typeLabel: string): Promise<void> {
    await this.page.getByRole('button', { name: typeLabel, exact: true }).click()
  }

  async filterToArea(area: string): Promise<void> {
    await this.page.getByRole('combobox').selectOption({ label: area })
  }

  async hideBringer(): Promise<void> {
    await this.page.getByRole('button', { name: 'No bringer', exact: true }).click()
  }

  async clearAll(): Promise<void> {
    await this.page.getByRole('button', { name: 'Clear all' }).click()
  }
}
