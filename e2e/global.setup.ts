/**
 * Runs once before the suite (Playwright "setup" project): puts the database
 * back to the seed, creates the role users and saves a signed-in session for
 * each, so tests start already logged in.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE, supabaseStatus, USERS } from './env';
import { closeDb, createRoleUser, resetDatabase } from './helpers/db';
import { clearEmails } from './helpers/mail';
import { loginAsAdmin, loginAsShopper, loginAsSuperAdmin } from './helpers/auth';

setup.describe.configure({ mode: 'serial' });

setup('test stack is reachable', async () => {
    const sb = supabaseStatus();
    const health = await fetch(`${sb.API_URL}/auth/v1/health`, { headers: { apikey: sb.ANON_KEY } });
    expect(health.ok, 'Supabase Auth on the local test stack').toBe(true);
});

setup('reset database to the seed', async () => {
    await resetDatabase();
    await clearEmails();
});

setup('create role users and save their sessions', async ({ browser }) => {
    mkdirSync(path.dirname(STORAGE_STATE('customer')), { recursive: true });
    for (const role of Object.keys(USERS) as (keyof typeof USERS)[]) {
        await createRoleUser(role);
    }

    const logins = {
        customer: (page: Parameters<typeof loginAsShopper>[0]) => loginAsShopper(page, USERS.customer.email),
        admin: (page: Parameters<typeof loginAsAdmin>[0]) => loginAsAdmin(page, USERS.admin.email),
        superAdmin: (page: Parameters<typeof loginAsSuperAdmin>[0]) => loginAsSuperAdmin(page, USERS.superAdmin.email),
    };

    for (const [role, login] of Object.entries(logins) as [keyof typeof USERS, (p: import('@playwright/test').Page) => Promise<void>][]) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await login(page);
        await context.storageState({ path: STORAGE_STATE(role) });
        await context.close();
    }
});

setup.afterAll(async () => {
    await closeDb();
});
