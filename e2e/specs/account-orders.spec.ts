/**
 * Customer account area: orders view, order tracking, profile editing, and loyalty points.
 */
import { test, expect } from '../fixtures';
import { USERS } from '../env';

test.describe('account area', () => {
    test('customer session displays user details and orders tab by default', async ({ customerPage }) => {
        await customerPage.goto('/account');
        await expect(customerPage.getByRole('heading', { name: 'My Orders' })).toBeVisible();
        await expect(customerPage.getByText(USERS.customer.email)).toBeVisible();
    });

    test('customer can switch tabs and update profile information', async ({ shopper, page }) => {
        await page.goto('/account');
        await expect(page.getByText(shopper.email)).toBeVisible();

        // Switch to My Profile tab
        await page.getByRole('button', { name: 'My Profile' }).click();
        await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();

        // Click Edit
        await page.getByRole('button', { name: 'Edit' }).click({ force: true });

        // Update First Name
        const firstNameInput = page.getByLabel('First Name');
        await firstNameInput.fill('UpdatedName');

        // Save Changes
        await page.getByRole('button', { name: 'Save Changes' }).click({ force: true });

        // Verify notification
        await expect(page.getByText('Profile saved.')).toBeVisible();
        await expect(page.getByText('UpdatedName')).toBeVisible();
    });

    test('customer can navigate to loyalty points tab', async ({ customerPage }) => {
        await customerPage.goto('/account');
        await customerPage.getByRole('button', { name: 'Loyalty Points' }).click();
        await expect(customerPage.getByRole('heading', { name: /Loyalty Points/i })).toBeVisible();
        await expect(customerPage.getByText('Points History')).toBeVisible();
    });
});
