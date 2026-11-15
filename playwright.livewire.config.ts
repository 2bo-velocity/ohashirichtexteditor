import { defineConfig, devices } from '@playwright/test';

// Livewire integration against a real Livewire server (see test/livewire.sh,
// which starts it). Kept apart from playwright.config.ts, whose pages are
// static files.
const port = Number(process.env.PORT ?? 8123);

export default defineConfig({
  testDir: 'tests/livewire',
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
