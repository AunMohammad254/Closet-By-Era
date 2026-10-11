/**
 * Shared test fixtures. Import `test` and `expect` from here instead of
 * @playwright/test.
 *
 *   customerPage / adminPage / superAdminPage  pages signed in as the seeded role users
 *   shopper                                    a brand-new signed-in customer on `page`
 *                                              (checkout is rate limited per user)
 */
import { test as base, expect, type Page } from '@playwright/test';
import { STORAGE_STATE } from './env';
import { createUser, type TestUser } from './helpers/db';
import { loginAsShopper } from './helpers/auth';

interface Fixtures {
    customerPage: Page;
    adminPage: Page;
    superAdminPage: Page;
    shopper: TestUser;
}

export const test = base.extend<Fixtures>({
    customerPage: async ({ browser }, use) => {
        const context = await browser.newContext({ storageState: STORAGE_STATE('customer') });
        await use(await context.newPage());
        await context.close();
    },
    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext({ storageState: STORAGE_STATE('admin') });
        await use(await context.newPage());
        await context.close();
    },
    superAdminPage: async ({ browser }, use) => {
        const context = await browser.newContext({ storageState: STORAGE_STATE('superAdmin') });
        await use(await context.newPage());
        await context.close();
    },
    shopper: async ({ page }, use) => {
        const user = await createUser();
        await loginAsShopper(page, user.email, user.password);
        await use(user);
    },
});

export { expect };
