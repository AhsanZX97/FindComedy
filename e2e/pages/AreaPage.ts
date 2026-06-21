import type { Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/** Area landing pages: the index (`/comedy`) and a single area (`/comedy/:slug`). */
export class AreaPage extends BasePage {
  async openIndex(): Promise<void> {
    await this.goto('/comedy')
  }

  async openArea(slug: string): Promise<void> {
    await this.goto(`/comedy/${slug}`)
  }

  areaLink(area: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(area) })
  }

  night(name: string): Locator {
    return this.page.getByRole('heading', { level: 2, name })
  }
}
