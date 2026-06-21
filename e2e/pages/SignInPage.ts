import type { Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/** The email-OTP sign-in page (route `/auth`). */
export class SignInPage extends BasePage {
  async open(): Promise<void> {
    await this.goto('/auth')
    await this.emailField().waitFor({ state: 'visible' })
  }

  private emailField(): Locator {
    return this.page.getByPlaceholder('you@example.com')
  }

  private codeField(): Locator {
    return this.page.getByPlaceholder('123456')
  }

  async requestCode(email: string): Promise<void> {
    await this.emailField().fill(email)
    await this.page.getByRole('button', { name: 'Send code' }).click()
  }

  async enterValidCode(): Promise<void> {
    await this.codeField().fill('123456')
    await this.page.getByRole('button', { name: 'Verify' }).click()
  }

  async useDifferentEmail(): Promise<void> {
    await this.page.getByRole('button', { name: 'Use a different email' }).click()
  }

  codePrompt(): Locator {
    return this.page.getByText(/sent a 6-digit code/i)
  }

  emailPrompt(): Locator {
    return this.emailField()
  }
}
