import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 120_000,
  use: {
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1280, height: 900 },
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
