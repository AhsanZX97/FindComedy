import type { Locator } from '@playwright/test'
import { BasePage } from './BasePage'

// Field name (from a scenario data table) → the input's placeholder text. The
// form's <label>s aren't wired to inputs via htmlFor, so we target by placeholder.
const PLACEHOLDERS: Record<string, string> = {
  name: 'e.g. Knock2Bag',
  about: 'What makes this night special?',
  venue: 'e.g. The Camden Head',
  address: 'e.g. 100 Camden High St, London NW1 0LU',
}

/** The "Submit a comedy night" form (route `/submit`). */
export class SubmitPage extends BasePage {
  async open(): Promise<void> {
    await this.goto('/submit')
    await this.page
      .getByRole('heading', { name: 'Submit a comedy night' })
      .waitFor({ state: 'visible' })
  }

  async fill(fields: Record<string, string>[]): Promise<void> {
    for (const { field, value } of fields) {
      const placeholder = PLACEHOLDERS[field]
      if (!placeholder) throw new Error(`Unknown field "${field}" in scenario data table`)
      await this.page.getByPlaceholder(placeholder).fill(value)
    }
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Submit night for review' }).click()
  }

  confirmation(): Locator {
    return this.page.getByRole('heading', { name: 'Night submitted!' })
  }

  londonError(): Locator {
    return this.page.getByText(/only lists London comedy nights/i)
  }

  /** Native HTML validation: the required Night-name field reports as invalid. */
  nameFieldIsInvalid(): Promise<boolean> {
    return this.page
      .getByPlaceholder(PLACEHOLDERS.name)
      .evaluate((el) => !(el as HTMLInputElement).validity.valid)
  }
}
