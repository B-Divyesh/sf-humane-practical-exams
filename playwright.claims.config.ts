import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/claims',
  timeout: 90_000,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:18083',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run build && PORT=18083 DATABASE_URL="sqlite://data/claims.db?mode=rwc" SUBMISSION_ENCRYPTION_KEY=claims-only-encryption-key cargo run',
    url: 'http://127.0.0.1:18083/health',
    timeout: 120_000,
    reuseExistingServer: false
  }
});
