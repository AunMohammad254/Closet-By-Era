/**
 * End-to-end tests: the production build of the app, running against the local
 * Supabase test stack (e2e/supabase) with email captured by MailDev.
 *
 *   bun run e2e:db:start   start the test stack (Docker)
 *   bun run test:e2e       run every test (builds the app first)
 *   bun run e2e:report     open the last HTML report
 *
 * See e2e/README.md.
 */
import { defineConfig, devices } from '@playwright/test';
import { appEnv, APP_PORT, BASE_URL, MAILDEV } from './e2e/env';

const CI = !!process.env.CI;
const next = 'node node_modules/next/dist/bin/next';
const serve = `${next} start -p ${APP_PORT} -H 0.0.0.0`;

export default defineConfig({
    testDir: './e2e',
    // Tests share one database, so they run one at a time, in file order.
    fullyParallel: false,
    workers: 1,
    forbidOnly: CI,
    retries: CI ? 1 : 0,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: CI
        ? [['list'], ['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'setup', testMatch: /global\.setup\.ts/ },
        {
            name: 'chromium',
            testMatch: /.*\.spec\.ts/,
            dependencies: ['setup'],
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: [
        {
            command: `node node_modules/maildev/dist/bin/maildev.js --smtp ${MAILDEV.smtpPort} --web ${MAILDEV.webPort} --ip 127.0.0.1`,
            url: MAILDEV.url,
            reuseExistingServer: true,
        },
        {
            command: process.env.E2E_SKIP_BUILD ? serve : `${next} build --webpack && ${serve}`,
            url: BASE_URL,
            env: { ...process.env as Record<string, string>, ...appEnv() },
            timeout: 360_000,
            reuseExistingServer: !CI,
            stdout: 'pipe',
            stderr: 'pipe',
        },
    ],
});
