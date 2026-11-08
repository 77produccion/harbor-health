import { defineConfig } from '@playwright/test';
import process from 'node:process';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4321);

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    launchOptions: process.platform === 'win32' ? { channel: 'msedge' } : {},
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}/es/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
