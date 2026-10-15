/**
 * Admin dashboard end-to-end tests: dashboard metrics, products catalog,
 * orders, and coupons management.
 */
import { test, expect } from '../fixtures';

test.describe('admin dashboard', () => {
    test('renders overview with stats cards and quick actions', async ({ adminPage }) => {
        await adminPage.goto('/admin');
        await expect(adminPage.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
        await expect(adminPage.getByText('Total Revenue')).toBeVisible();
        await expect(adminPage.getByText('Active Orders')).toBeVisible();
        await expect(adminPage.getByText('Total Products')).toBeVisible();
    });

    test('views and searches products catalog', async ({ adminPage }) => {
        await adminPage.goto('/admin/products');
        await expect(adminPage.getByRole('heading', { level: 1, name: 'Products' })).toBeVisible();
        await expect(adminPage.getByRole('link', { name: /Add Product/i })).toBeVisible();
        await expect(adminPage.getByPlaceholder('Search products...')).toBeVisible();

        // Search for seeded product
        await adminPage.getByPlaceholder('Search products...').fill('Oxford');
        await adminPage.getByPlaceholder('Search products...').press('Enter');
        await expect(adminPage.getByText('Oxford')).toBeVisible();
    });

    test('views orders management table', async ({ adminPage }) => {
        await adminPage.goto('/admin/orders');
        await expect(adminPage.getByRole('heading', { name: 'Orders' })).toBeVisible();
    });

    test('views coupons management panel', async ({ adminPage }) => {
        await adminPage.goto('/admin/coupons');
        await expect(adminPage.getByRole('heading', { name: 'Coupons' })).toBeVisible();
        await expect(adminPage.getByRole('button', { name: /Create Coupon/i })).toBeVisible();
    });
});
