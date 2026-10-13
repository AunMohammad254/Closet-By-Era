/**
 * Accounts: sign-up with email confirmation, sign-in, sign-out, password reset,
 * protected pages and staff-only areas. Emails go through the Send Email hook
 * (/api/webhooks/confirmation-email) and are read back from MailDev.
 */
import { randomUUID } from 'node:crypto';
import { test, expect } from '../fixtures';
import { PASSWORD, USERS } from '../env';
import { createUser, generateEmailToken, one } from '../helpers/db';
import { linkIn, waitForEmail } from '../helpers/mail';
import { formAlert, loginAsShopper } from '../helpers/auth';

const newEmail = () => `signup-${randomUUID().slice(0, 8)}@closetbyera.test`;

test.describe('sign up', () => {
    test('creates an account that works once the email is confirmed', async ({ page }) => {
        const email = newEmail();
        await page.goto('/auth/register');
        await page.getByLabel('Full name').fill('Sara Ahmed');
        await page.getByLabel('Email address').fill(email);
        await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
        await page.getByRole('button', { name: 'Sign Up' }).click();
        await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

        // Not confirmed yet: signing in is refused.
        await page.goto('/auth/login');
        await page.getByLabel('Email address').fill(email);
        await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
        await page.getByRole('button', { name: 'Log In' }).click();
        await expect(formAlert(page)).toContainText(/not confirmed/i);

        const mail = await waitForEmail(email, 'Confirm your email address');
        expect(mail.html).toContain('Closet By Era');
        const link = linkIn(mail, /\/auth\/confirm\?/);
        expect(new URL(link).searchParams.get('type')).toBe('signup');

        await page.goto(link);
        await expect(page).toHaveURL(/\/account/);
        await expect(page.getByText(email)).toBeVisible();

        const customer = await one<{ first_name: string; last_name: string; role: string }>(
            'select first_name, last_name, role from public.customers where email = $1', [email]
        );
        expect(customer).toEqual({ first_name: 'Sara', last_name: 'Ahmed', role: 'customer' });
    });

    test('checks the form before calling the server', async ({ page }) => {
        await page.goto('/auth/register');
        await page.getByLabel('Full name').fill('Sara Ahmed');
        await page.getByLabel('Email address').fill(newEmail());
        await page.getByLabel('Password', { exact: true }).fill('short');
        await page.getByRole('button', { name: 'Sign Up' }).click();
        await expect(formAlert(page)).toHaveText('Password must be at least 8 characters');
    });

    test('a used confirmation link is rejected', async ({ page }) => {
        const email = newEmail();
        await page.goto('/auth/register');
        await page.getByLabel('Full name').fill('Used Link');
        await page.getByLabel('Email address').fill(email);
        await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
        await page.getByRole('button', { name: 'Sign Up' }).click();
        const link = linkIn(await waitForEmail(email, 'Confirm your email address'), /\/auth\/confirm\?/);

        await page.goto(link);
        await expect(page).toHaveURL(/\/account/);
        await page.context().clearCookies();
        await page.goto(link);
        await expect(page).toHaveURL(/\/auth\/login\?error=link_expired/);
        await expect(formAlert(page)).toHaveText('That email link is invalid or has expired. Please sign in or request a new link.');
    });
});

test.describe('sign in and out', () => {
    test('wrong password is refused', async ({ page }) => {
        await page.goto('/auth/login');
        await page.getByLabel('Email address').fill(USERS.customer.email);
        await page.getByLabel('Password', { exact: true }).fill('not-the-password');
        await page.getByRole('button', { name: 'Log In' }).click();
        await expect(formAlert(page)).toHaveText('Invalid login credentials');
        await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('the password can be shown while typing', async ({ page }) => {
        await page.goto('/auth/login');
        const field = page.getByLabel('Password', { exact: true });
        await field.fill('secret-value');
        await expect(field).toHaveAttribute('type', 'password');
        await page.getByRole('button', { name: 'Show password' }).click();
        await expect(field).toHaveAttribute('type', 'text');
    });

    test('signing out ends the session', async ({ shopper, page }) => {
        await page.goto('/account');
        await page.getByRole('button', { name: 'Sign Out' }).click();
        await expect(page).toHaveURL(/\/$/);
        await page.goto('/account');
        await expect(page).toHaveURL(/\/auth\/login\?redirectedFrom=%2Faccount/);
        expect(shopper.email).toBeTruthy();
    });
});

test.describe('protected pages', () => {
    for (const path of ['/account', '/checkout', '/profile']) {
        test(`${path} needs a signed-in user`, async ({ page }) => {
            await page.goto(path);
            await expect(page).toHaveURL(new RegExp(`/auth/login\\?redirectedFrom=${encodeURIComponent(path)}`));
        });
    }

    test('signing in returns to the page that asked', async ({ page }) => {
        const user = await createUser();
        await page.goto('/account?tab=loyalty');
        await expect(page).toHaveURL(/redirectedFrom=%2Faccount/);
        await loginAsShopper(page, user.email, PASSWORD, '/account');
        await expect(page).toHaveURL(/\/account/);
    });

    test('a redirect to another site is ignored', async ({ page }) => {
        const user = await createUser();
        for (const target of ['//evil.example/', '/\\evil.example/']) {
            await page.context().clearCookies();
            await page.goto(`/auth/login?redirectedFrom=${encodeURIComponent(target)}`);
            await page.getByLabel('Email address').fill(user.email);
            await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
            await page.getByRole('button', { name: 'Log In' }).click();
            await expect(page).toHaveURL('http://localhost:3123/account');
        }
    });

    test('email links only continue to pages on this site', async ({ page }) => {
        const user = await createUser();
        const token = await generateEmailToken('magiclink', user.email);
        await page.goto(`/auth/confirm?token_hash=${token}&type=magiclink&next=${encodeURIComponent('/\\evil.example/')}`);
        await expect(page).toHaveURL('http://localhost:3123/');

        const second = await generateEmailToken('magiclink', user.email);
        await page.goto(`/auth/confirm?token_hash=${second}&type=magiclink&next=${encodeURIComponent('/account?tab=profile')}`);
        await expect(page).toHaveURL(/\/account\?tab=profile$/);
    });

    test('a broken email link sends the user to sign in', async ({ page }) => {
        await page.goto('/auth/confirm?token_hash=not-a-real-token&type=signup&next=/account');
        await expect(page).toHaveURL(/\/auth\/login\?error=link_expired/);
    });
});

test.describe('staff areas', () => {
    test('customers cannot open the admin or owner panels', async ({ customerPage }) => {
        await customerPage.goto('/admin');
        await expect(customerPage).toHaveURL(/\/\?error=unauthorized$/);
        await customerPage.goto('/admin/orders');
        await expect(customerPage).toHaveURL(/\/\?error=unauthorized$/);
        await customerPage.goto('/super-admin');
        await expect(customerPage).toHaveURL(/\/\?error=unauthorized$/);
        await customerPage.goto('/dashboard');
        await expect(customerPage).toHaveURL(/\/\?error=unauthorized$/);
    });

    test('the store admin cannot open the owner panel', async ({ adminPage }) => {
        await adminPage.goto('/super-admin');
        await expect(adminPage).toHaveURL(/\/\?error=unauthorized$/);
    });

    test('an admin role on a different email is not enough', async ({ page }) => {
        // ADMIN_EMAIL pins the admin panel to one account.
        const other = await createUser({ role: 'admin' });
        await loginAsShopper(page, other.email);
        await page.goto('/admin');
        await expect(page).toHaveURL(/\/\?error=unauthorized$/);
    });

    test('guests are sent to the right login page', async ({ page }) => {
        await page.goto('/admin/products');
        await expect(page).toHaveURL(/\/admin\/login\?redirectedFrom=%2Fadmin%2Fproducts/);
        await page.goto('/super-admin/users');
        await expect(page).toHaveURL(/\/super-admin\/login\?redirectedFrom=%2Fsuper-admin%2Fusers/);
    });

    test('the admin login refuses customers', async ({ page }) => {
        await page.goto('/admin/login');
        await page.locator('input[name="email"]').fill(USERS.customer.email);
        await page.locator('input[name="password"]').fill(PASSWORD);
        await page.getByRole('button', { name: 'Secure Login' }).click();
        await expect(formAlert(page)).toHaveText('Invalid credentials');
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    test('the owner login refuses other staff', async ({ page }) => {
        // A fresh admin: the refusal signs the user out everywhere, which would
        // end the shared admin session the other tests use.
        const staff = await createUser({ role: 'admin' });
        await page.goto('/super-admin/login');
        await page.getByPlaceholder('Enter your email').fill(staff.email);
        await page.getByPlaceholder('Enter your password').fill(PASSWORD);
        await page.getByRole('button', { name: 'Access Super Admin' }).click();
        await expect(formAlert(page)).toHaveText('Access denied. Super admin privileges required.');
    });

    test('the owner login returns to the requested panel page', async ({ page }) => {
        await page.goto('/super-admin/audit');
        await expect(page).toHaveURL(/redirectedFrom=%2Fsuper-admin%2Faudit/);
        await page.getByPlaceholder('Enter your email').fill(USERS.superAdmin.email);
        await page.getByPlaceholder('Enter your password').fill(PASSWORD);
        await page.getByRole('button', { name: 'Access Super Admin' }).click();
        await expect(page).toHaveURL(/\/super-admin\/audit$/);
    });
});

test.describe('password reset', () => {
    test('a reset email sets a new password', async ({ page }) => {
        const user = await createUser();
        await page.goto('/auth/forgot-password');
        await page.getByLabel('Email address').fill(user.email);
        await page.getByRole('button', { name: 'Reset Password' }).click();
        await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

        const mail = await waitForEmail(user.email, 'Reset your password');
        const link = linkIn(mail, /\/auth\/confirm\?/);
        expect(new URL(link).searchParams.get('type')).toBe('recovery');
        await page.goto(link);
        await expect(page).toHaveURL(/\/auth\/reset-password/);

        const newPassword = 'N3w-Passw0rd!';
        await page.getByLabel('New password', { exact: true }).fill(newPassword);
        await page.getByLabel('Confirm new password').fill('different-1234');
        await page.getByRole('button', { name: /update password/i }).click();
        await expect(formAlert(page)).toHaveText('Passwords do not match');

        await page.getByLabel('Confirm new password').fill(newPassword);
        await page.getByRole('button', { name: /update password/i }).click();
        await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();

        await page.context().clearCookies();
        await page.goto('/auth/login');
        await page.getByLabel('Email address').fill(user.email);
        await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
        await page.getByRole('button', { name: 'Log In' }).click();
        await expect(formAlert(page)).toHaveText('Invalid login credentials');
        await loginAsShopper(page, user.email, newPassword);
    });

    test('the reset page without a valid link says it expired', async ({ page }) => {
        await page.goto('/auth/reset-password');
        await expect(page.getByRole('heading', { name: 'Link expired' })).toBeVisible();
    });

    test('an unknown email still shows the same message', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        await page.getByLabel('Email address').fill(newEmail());
        await page.getByRole('button', { name: 'Reset Password' }).click();
        await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    });
});
