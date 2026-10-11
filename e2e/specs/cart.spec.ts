/** The cart: adding, changing and removing items, totals, persistence and codes. */
import { test, expect } from '../fixtures';
import { COUPONS, GIFT_CARDS, PRODUCTS, productPath, SHIPPING } from '../data';
import { addToCart, cartLink, pkr, productCard } from '../helpers/shop';
import { createUser, sql } from '../helpers/db';
import { loginAsShopper } from '../helpers/auth';

test.describe('as a guest', () => {
    test('adds a product with its size and colour', async ({ page }) => {
        await addToCart(page, 'shirt', { size: 'L', color: 'Blue', quantity: 2 });
        await expect(cartLink(page)).toHaveAccessibleName('Cart (2 items)');

        await page.goto('/cart');
        await expect(page.getByRole('heading', { level: 1, name: 'Shopping Cart' })).toBeVisible();
        const item = page.getByTestId('cart-item');
        await expect(item).toHaveCount(1);
        await expect(item).toContainText(PRODUCTS.shirt.name);
        await expect(item).toContainText('Size: L');
        await expect(item).toContainText('Color: Blue');
        await expect(page.getByLabel(`Quantity of ${PRODUCTS.shirt.name}`)).toHaveText('2');
        await expect(page.getByTestId('cart-subtotal')).toHaveText(pkr(PRODUCTS.shirt.price * 2));
        await expect(page.getByTestId('cart-shipping')).toHaveText('Free'); // 7,000 is over the free-shipping line
        await expect(page.getByTestId('cart-total')).toHaveText(pkr(PRODUCTS.shirt.price * 2));
    });

    test('asks for a size before adding', async ({ page }) => {
        await page.goto(productPath('shirt'));
        const dialog = page.waitForEvent('dialog');
        await page.getByRole('button', { name: /^Add to Cart/ }).click();
        const d = await dialog;
        expect(d.message()).toBe('Please select a size');
        await d.dismiss();
        await expect(cartLink(page)).toHaveAccessibleName('Cart');
    });

    test('charges shipping under the free-shipping line and updates as quantities change', async ({ page }) => {
        await addToCart(page, 'belt');
        await page.goto('/cart');
        await expect(page.getByTestId('cart-shipping')).toHaveText(pkr(SHIPPING.standard));
        await expect(page.getByText(`Add ${pkr(SHIPPING.freeOver - PRODUCTS.belt.price)} more for free shipping`)).toBeVisible();
        await expect(page.getByTestId('cart-total')).toHaveText(pkr(PRODUCTS.belt.price + SHIPPING.standard));

        await page.getByRole('button', { name: `Increase quantity of ${PRODUCTS.belt.name}` }).click();
        await expect(page.getByLabel(`Quantity of ${PRODUCTS.belt.name}`)).toHaveText('2');
        await expect(page.getByTestId('cart-subtotal')).toHaveText(pkr(PRODUCTS.belt.price * 2));
        await expect(page.getByTestId('cart-shipping')).toHaveText('Free');

        await page.getByRole('button', { name: `Decrease quantity of ${PRODUCTS.belt.name}` }).click();
        await expect(page.getByLabel(`Quantity of ${PRODUCTS.belt.name}`)).toHaveText('1');
        await expect(page.getByTestId('cart-shipping')).toHaveText(pkr(SHIPPING.standard));
    });

    test('keeps separate lines for different sizes', async ({ page }) => {
        await addToCart(page, 'shirt', { size: 'S' });
        await addToCart(page, 'shirt', { size: 'M' });
        await addToCart(page, 'shirt', { size: 'M' });
        await page.goto('/cart');
        await expect(page.getByTestId('cart-item')).toHaveCount(2);
        await expect(cartLink(page)).toHaveAccessibleName('Cart (3 items)');
    });

    test('removes items and can be cleared', async ({ page }) => {
        await addToCart(page, 'shirt');
        await addToCart(page, 'belt');
        await page.goto('/cart');
        await page.getByRole('button', { name: `Remove ${PRODUCTS.belt.name}` }).click();
        await expect(page.getByTestId('cart-item')).toHaveCount(1);
        await page.getByRole('button', { name: 'Clear cart' }).click();
        await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    });

    test('survives a reload', async ({ page }) => {
        await addToCart(page, 'sale');
        await page.reload();
        await expect(cartLink(page)).toHaveAccessibleName('Cart (1 item)');
        await page.goto('/cart');
        await expect(page.getByTestId('cart-item')).toContainText(PRODUCTS.sale.name);
    });

    test('quick add from a product card', async ({ page }) => {
        await page.goto('/accessories');
        await productCard(page, PRODUCTS.belt.name).getByRole('button', { name: `Quick Add ${PRODUCTS.belt.name}` }).click();
        await expect(cartLink(page)).toHaveAccessibleName('Cart (1 item)');
        await page.goto('/cart');
        const item = page.getByTestId('cart-item');
        await expect(item).toContainText(PRODUCTS.belt.name);
        // A card has no size picker, so no size is made up.
        await expect(item).not.toContainText('Size:');
    });

    test('checkout asks a guest to sign in and comes back', async ({ page }) => {
        await addToCart(page, 'shirt');
        await page.goto('/cart');
        await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
        await expect(page).toHaveURL(/\/auth\/login\?redirectedFrom=%2Fcheckout/);
    });
});

test.describe('signed in', () => {
    test('a guest cart is kept after signing in and saved to the account', async ({ page }) => {
        const user = await createUser();
        await addToCart(page, 'belt');
        await loginAsShopper(page, user.email);
        await expect(cartLink(page)).toHaveAccessibleName('Cart (1 item)');
        await expect.poll(async () => (await sql<{ product_id: string; quantity: number }>(
            'select product_id, quantity from public.cart_items where user_id = $1', [user.authId]
        ))).toEqual([{ product_id: PRODUCTS.belt.id, quantity: 1 }]);
    });

    test('the account cart follows the shopper to a new browser', async ({ shopper, page, browser }) => {
        await addToCart(page, 'shirt', { size: 'S' });
        await expect.poll(async () => (await sql('select 1 from public.cart_items where user_id = $1', [shopper.authId])).length).toBe(1);

        const other = await browser.newContext();
        const second = await other.newPage();
        await loginAsShopper(second, shopper.email);
        await expect(cartLink(second)).toHaveAccessibleName('Cart (1 item)');
        await other.close();
    });

    test('a valid coupon is remembered for checkout', async ({ shopper, page }) => {
        void shopper;
        await addToCart(page, 'shirt');
        await page.goto('/cart');
        await page.getByLabel('Coupon or gift card code').fill(COUPONS.tenPercent.toLowerCase());
        await page.getByRole('button', { name: 'Apply', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText(`Code ${COUPONS.tenPercent} will be applied at checkout.`);
    });

    test('a gift card is accepted in the cart', async ({ shopper, page }) => {
        void shopper;
        await addToCart(page, 'shirt');
        await page.goto('/cart');
        await page.getByLabel('Coupon or gift card code').fill(GIFT_CARDS.partial.code);
        await page.getByRole('button', { name: 'Apply', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText(`Gift card ${GIFT_CARDS.partial.code} will be applied at checkout.`);
    });

    test('unusable codes explain why', async ({ shopper, page }) => {
        void shopper;
        await addToCart(page, 'shirt');
        await page.goto('/cart');
        const input = page.getByLabel('Coupon or gift card code');
        const apply = page.getByRole('button', { name: 'Apply', exact: true });
        const cases: [string, string][] = [
            ['NOPE-NOT-A-CODE', 'Invalid coupon code'],
            [COUPONS.expired, 'Coupon has expired'],
            [GIFT_CARDS.empty.code, 'Card has no balance'],
        ];
        for (const [code, message] of cases) {
            await input.fill(code);
            await apply.click();
            await expect(page.getByRole('status')).toHaveText(message);
        }
    });
});
