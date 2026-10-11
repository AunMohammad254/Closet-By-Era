/** Wishlist, product comparison, display currency and theme. */
import { test, expect } from '../fixtures';
import { PRODUCTS, productPath } from '../data';
import { addToCart, cartLink, money, pkr, productCard } from '../helpers/shop';
import { sql } from '../helpers/db';

test.describe('wishlist', () => {
    test('saves products from the product page and a card', async ({ page }) => {
        await page.goto(productPath('shirt'));
        await page.getByRole('button', { name: 'Add to wishlist' }).click();
        await expect(page.getByRole('button', { name: 'Remove from wishlist' })).toHaveAttribute('aria-pressed', 'true');

        await page.goto('/accessories');
        await productCard(page, PRODUCTS.belt.name).getByRole('button', { name: `Add ${PRODUCTS.belt.name} to wishlist` }).click();

        await page.goto('/wishlist');
        await expect(page.getByRole('heading', { level: 1, name: 'My Wishlist' })).toBeVisible();
        await expect(page.getByText('2 items saved')).toBeVisible();
        await expect(productCard(page, PRODUCTS.shirt.name)).toBeVisible();
        await expect(productCard(page, PRODUCTS.belt.name)).toBeVisible();
    });

    test('moves an item to the cart and removes items', async ({ page }) => {
        await page.goto(productPath('belt'));
        await page.getByRole('button', { name: 'Add to wishlist' }).click();
        await page.goto(productPath('sale'));
        await page.getByRole('button', { name: 'Add to wishlist' }).click();

        await page.goto('/wishlist');
        await page.getByRole('button', { name: `Move ${PRODUCTS.belt.name} to cart` }).click();
        await expect(cartLink(page)).toHaveAccessibleName('Cart (1 item)');
        await expect(productCard(page, PRODUCTS.belt.name)).toHaveCount(0);

        await page.getByRole('button', { name: `Remove ${PRODUCTS.sale.name} from wishlist` }).click();
        await expect(page.getByRole('heading', { name: 'Your wishlist is empty' })).toBeVisible();
    });

    test('a signed-in wishlist is stored on the account', async ({ shopper, page }) => {
        await page.goto(productPath('sale'));
        await page.getByRole('button', { name: 'Add to wishlist' }).click();
        await expect.poll(async () => (await sql<{ product_id: string }>(
            'select product_id from public.wishlist_items where user_id = $1', [shopper.authId]
        )).map(r => r.product_id)).toEqual([PRODUCTS.sale.id]);
    });
});

test.describe('compare', () => {
    test('compares products side by side', async ({ page }) => {
        await page.goto(productPath('shirt'));
        await page.getByRole('button', { name: 'Add to compare' }).click();
        await expect(page.getByRole('button', { name: 'Remove from compare' })).toHaveAttribute('aria-pressed', 'true');
        await page.goto(productPath('soldOut'));
        await page.getByRole('button', { name: 'Add to compare' }).click();
        await expect(page.getByText('Compare (2/4):')).toBeVisible();

        await page.getByRole('link', { name: 'Compare Products' }).click();
        await expect(page).toHaveURL(/\/compare$/);
        const table = page.getByRole('table');
        await expect(table.getByRole('link', { name: PRODUCTS.shirt.name })).toBeVisible();
        await expect(table.getByRole('link', { name: PRODUCTS.soldOut.name })).toBeVisible();

        const row = (label: string) => table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: label }) });
        await expect(row('Category')).toContainText('Shirts');
        await expect(row('Category')).toContainText('Knitwear');
        await expect(row('Availability')).toContainText('In Stock');
        await expect(row('Availability')).toContainText('Out of Stock');
        await expect(row('Sizes')).toContainText('S');
        await expect(row('Colors')).toContainText('Blue');
        await expect(row('Description')).toContainText('Crisp cotton oxford shirt.');
        await expect(table.getByRole('button', { name: `Add ${PRODUCTS.soldOut.name} to cart` })).toBeDisabled();

        await table.getByRole('button', { name: `Add ${PRODUCTS.shirt.name} to cart` }).click();
        await expect(page.getByRole('status')).toHaveText(`${PRODUCTS.shirt.name} added to cart.`);
        await expect(cartLink(page)).toHaveAccessibleName('Cart (1 item)');

        await table.getByRole('button', { name: `Remove ${PRODUCTS.soldOut.name} from compare` }).click();
        await expect(table.getByRole('link', { name: PRODUCTS.soldOut.name })).toHaveCount(0);
    });

    test('allows at most four products', async ({ page }) => {
        for (const key of ['shirt', 'belt', 'sale', 'lowStock'] as const) {
            await page.goto(productPath(key));
            await page.getByRole('button', { name: 'Add to compare' }).click();
        }
        await page.goto(productPath('chinos'));
        const dialog = page.waitForEvent('dialog');
        await page.getByRole('button', { name: 'Add to compare' }).click();
        const d = await dialog;
        expect(d.message()).toBe('You can only compare up to 4 products at a time.');
        await d.dismiss();
        await expect(page.getByText('Compare (4/4):')).toBeVisible();
    });

    test('is empty until something is added', async ({ page }) => {
        await page.goto('/compare');
        await expect(page.getByText('You haven\'t selected any products to compare.')).toBeVisible();
    });
});

test.describe('display currency', () => {
    test('converts prices for display and keeps the choice', async ({ page }) => {
        await page.goto(productPath('shirt'));
        await page.getByRole('button', { name: 'Currency: PKR' }).click();
        await page.getByRole('menuitem', { name: 'USD ($)' }).click();
        await expect(page.getByRole('button', { name: 'Currency: USD' })).toBeVisible();
        await expect(page.getByText(money('USD', PRODUCTS.shirt.price, 0.0036), { exact: true }).first()).toBeVisible();

        await page.reload();
        await expect(page.getByRole('button', { name: 'Currency: USD' })).toBeVisible();
        await expect(page.getByText(money('USD', PRODUCTS.shirt.price, 0.0036), { exact: true }).first()).toBeVisible();
    });

    test('the cart says orders are charged in PKR', async ({ page }) => {
        await addToCart(page, 'shirt');
        await page.goto('/cart');
        await page.getByRole('button', { name: 'Currency: PKR' }).click();
        await page.getByRole('menuitem', { name: 'EUR (€)' }).click();
        await expect(page.getByTestId('cart-total')).toHaveText(money('EUR', PRODUCTS.shirt.price, 0.0033));
        await expect(page.getByText(`Approximate. Orders are charged in PKR (${pkr(PRODUCTS.shirt.price)}).`)).toBeVisible();
    });
});

test.describe('theme', () => {
    test('toggles dark mode and remembers it', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
        await page.goto('/');
        const html = page.locator('html');
        await expect(html).toHaveClass(/\blight\b/);
        await page.getByRole('button', { name: 'Switch to dark mode' }).click();
        await expect(html).toHaveClass(/\bdark\b/);
        await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();

        await page.reload();
        await expect(html).toHaveClass(/\bdark\b/);
        await page.getByRole('button', { name: 'Switch to light mode' }).click();
        await expect(html).toHaveClass(/\blight\b/);
    });

    test('animates the switch with a view transition', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
        await page.goto('/');
        await page.getByRole('button', { name: 'Switch to dark mode' }).click();
        await expect(page.locator('html')).toHaveClass(/\bdark\b/);
        // The helper class is removed once the reveal finishes.
        await expect(page.locator('html')).not.toHaveClass(/theme-transition/, { timeout: 5_000 });
    });
});
