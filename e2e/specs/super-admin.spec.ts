/**
 * Super admin portal: system overview, analytics, and owner privileges.
 */
import { test, expect } from '../fixtures';

test.describe('super admin portal', () => {
    test('renders super admin dashboard with system analytics and quick actions', async ({ superAdminPage }) => {
        await superAdminPage.goto('/super-admin');
        await expect(superAdminPage.getByRole('heading', { level: 1, name: 'Super Admin Dashboard' })).toBeVisible();
        await expect(superAdminPage.getByText('Owner Access')).toBeVisible();

        // Check Quick Actions links
        await expect(superAdminPage.getByRole('link', { name: /Manage User Roles/i })).toBeVisible();
        await expect(superAdminPage.getByRole('link', { name: /View Audit Logs/i })).toBeVisible();
        await expect(superAdminPage.getByRole('link', { name: /Go to Admin Panel/i })).toBeVisible();
    });
});
