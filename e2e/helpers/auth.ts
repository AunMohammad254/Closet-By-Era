/** Signing in through the real login pages. */
import { expect, type Page } from '@playwright/test';
import { PASSWORD } from '../env';

/** Shopper login (/auth/login). Lands on /account unless `redirectTo` is given. */
export async function loginAsShopper(page: Page, email: string, password = PASSWORD, redirectTo?: string): Promise<void> {
    await page.goto(redirectTo ? `/auth/login?redirectedFrom=${encodeURIComponent(redirectTo)}` : '/auth/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL(new RegExp(`${(redirectTo ?? '/account').replace(/[?]/g, '\\?')}`), { timeout: 20_000 });
}

/** Store admin login (/admin/login; only the ADMIN_EMAIL account may use it). */
export async function loginAsAdmin(page: Page, email: string, password = PASSWORD): Promise<void> {
    await page.goto('/admin/login');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Secure Login' }).click();
    await expect(page).toHaveURL(/\/admin(\/)?$/, { timeout: 20_000 });
}

/** Super-admin login (/super-admin/login; also records login history). */
export async function loginAsSuperAdmin(page: Page, email: string, password = PASSWORD): Promise<void> {
    await page.goto('/super-admin/login');
    await page.getByPlaceholder('Enter your email').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: 'Access Super Admin' }).click();
    await expect(page).toHaveURL(/\/super-admin(\/)?$/, { timeout: 20_000 });
}
