import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  use: { baseURL: 'http://127.0.0.1:8080', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && cargo run',
    url: 'http://127.0.0.1:8080/health',
    timeout: 120_000,
    reuseExistingServer: true,
    env: { SUBMISSION_ENCRYPTION_KEY: 'playwright-only-encryption-key', DATABASE_URL: 'sqlite://data/e2e.db?mode=rwc' }
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } }
  ]
});
