/** Storefront steps shared by the shopping specs. */
import { expect, type Locator, type Page } from '@playwright/test';
import { PRODUCTS, productPath, type ProductKey } from '../data';
import type { TestUser } from './db';

/** A PKR amount exactly as the app prints it (Intl en-US, no decimals). */
export function pkr(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

/** Same, for the display currencies (two decimals). */
export function money(currency: 'USD' | 'GBP' | 'EUR' | 'AED', amountInPkr: number, rate: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountInPkr * rate);
}

/** The product card for `name` on a listing page. */
export function productCard(page: Page, name: string): Locator {
    return page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
}

/**
 * Adds a product from its page. Picks the first size/colour unless given and
 * waits for the "Added to cart" confirmation.
 */
export async function addToCart(
    page: Page,
    product: ProductKey | { path: string; name: string },
    opts: { size?: string; color?: string; quantity?: number } = {}
): Promise<void> {
    const { path, name } = typeof product === 'string'
        ? { path: productPath(product), name: PRODUCTS[product].name }
        : product;
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();

    const sizes = page.getByRole('group', { name: 'Size' });
    if (opts.size || await sizes.count()) {
        const size = opts.size ? sizes.getByRole('button', { name: opts.size, exact: true }) : sizes.getByRole('button').first();
        await size.click();
        await expect(size).toHaveAttribute('aria-pressed', 'true');
    }
    if (opts.color) {
        await page.getByRole('group', { name: 'Color' }).getByRole('button', { name: opts.color, exact: true }).click();
    }
    for (let q = 1; q < (opts.quantity ?? 1); q++) {
        await page.getByRole('button', { name: 'Increase quantity' }).click();
    }
    await expect(page.getByTestId('quantity-value')).toHaveText(String(opts.quantity ?? 1));
    await page.getByRole('button', { name: /^Add to Cart/ }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Added to cart!' })).toBeVisible();
}

/** The navbar cart link; its name carries the item count ("Cart (2 items)"). */
export function cartLink(page: Page): Locator {
    return page.getByRole('banner').getByRole('link', { name: /^Cart/ });
}

/** Opens /checkout and fills the information step for `user`. */
export async function fillCheckoutInformation(page: Page, user: Pick<TestUser, 'firstName' | 'lastName' | 'email'>): Promise<void> {
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Contact Information' })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue(user.email);
    await page.getByLabel('Phone').fill('+92 300 1234567');
    await page.getByLabel('First Name').fill(user.firstName);
    await page.getByLabel('Last Name').fill(user.lastName);
    await page.getByLabel('Address', { exact: true }).fill('12 Test Street');
    await page.getByLabel('City').fill('Lahore');
    await page.getByLabel('Postal Code').fill('54000');
}

/** Walks from the information step to payment, choosing the shipping method. */
export async function continueToPayment(page: Page, shipping: 'standard' | 'express' = 'standard'): Promise<void> {
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Shipping Method' })).toBeVisible();
    await page.getByText(shipping === 'express' ? 'Express Shipping' : 'Standard Shipping', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Payment Method' })).toBeVisible();
}

/** Applies a coupon or gift card code on the checkout summary. */
export async function applyCheckoutCode(page: Page, code: string): Promise<Locator> {
    await page.getByLabel('Discount Code').fill(code);
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    const message = page.getByRole('status').filter({ hasNotText: 'Added to cart' });
    await expect(message).toBeVisible();
    return message;
}

/** Chooses a payment method by its label and places the order. */
export async function placeOrder(page: Page, method: 'Cash on Delivery' | 'Credit/Debit Card' | 'Bank Transfer' | 'JazzCash' | null = 'Cash on Delivery'): Promise<void> {
    if (method) await page.getByText(method, { exact: true }).click();
    await page.getByRole('button', { name: /^(Place Order|Pay with card) — / }).click();
}

/** Waits for the confirmation screen and returns the order number. */
export async function confirmedOrderNumber(page: Page): Promise<string> {
    await expect(page.getByRole('heading', { name: 'Order Confirmed!' })).toBeVisible({ timeout: 20_000 });
    const number = (await page.getByTestId('order-number').textContent())?.trim() ?? '';
    expect(number).toMatch(/^CBE-\d{6}-[0-9A-F]{6}$/);
    return number;
}
