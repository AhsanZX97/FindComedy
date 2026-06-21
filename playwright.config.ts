import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

// Generates Playwright spec files from .feature + step definitions into .features-gen/.
const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  // Includes support/ so playwright-bdd can find the custom `test` (fixtures.ts).
  steps: ['e2e/steps/**/*.ts', 'e2e/support/fixtures.ts'],
})

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // HTML report doubles as living documentation; github annotations on CI.
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Serve the SPA in e2e mode so it loads .env.e2e (fake Supabase creds → form enabled).
  webServer: {
    command: `npx vite --mode e2e --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
