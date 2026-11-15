import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);

// The three engines behind the supported desktop browsers: Chromium (Chrome,
// Edge), Gecko (Firefox) and WebKit (Safari). WebKit is Safari's engine, not
// Safari itself, so a release is still checked by hand in real Safari.
export default defineConfig({
  testDir: 'tests/browser',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `node tests/browser/serve.mjs`,
    url: `http://127.0.0.1:${port}/csp.html`,
    env: { PORT: String(port), ...(process.env.BUNDLE ? { BUNDLE: process.env.BUNDLE } : {}) },
    reuseExistingServer: !process.env.CI,
  },
});
