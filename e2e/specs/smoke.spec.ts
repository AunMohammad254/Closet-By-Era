/** Fast checks that the stack is wired up: app, database, auth and each role. */
import { test, expect } from '../fixtures';
import { PRODUCTS, productPath } from '../data';

test('home page renders the storefront', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();
});

test('product page reads from the test database', async ({ page }) => {
    await page.goto(productPath('shirt'));
    await expect(page.getByRole('heading', { level: 1, name: PRODUCTS.shirt.name })).toBeVisible();
});

test('customer session is signed in', async ({ customerPage }) => {
    await customerPage.goto('/account');
    await expect(customerPage.getByRole('heading', { name: 'My Profile' })).toBeVisible();
});

test('admin session reaches the dashboard', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await expect(adminPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('super admin session reaches the dashboard', async ({ superAdminPage }) => {
    await superAdminPage.goto('/super-admin');
    await expect(superAdminPage.getByRole('heading', { name: 'Super Admin Dashboard' })).toBeVisible();
});
