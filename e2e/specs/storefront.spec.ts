/** Browsing the shop as a guest: home, departments, listing filters, search and product pages. */
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { PRODUCTS, productPath } from '../data';
import { pkr, productCard } from '../helpers/shop';

/**
 * A missing product shows the not-found page and asks search engines not to
 * index it. The status stays 200: the shop's loading.tsx streams the page, so
 * the response has started before the product lookup ends, and Next.js marks
 * the page noindex instead (see Status Codes in the loading.js docs).
 */
async function expectNotFound(page: Page) {
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
}

test.describe('home page', () => {
    test('shows the hero, announcement and featured products from the database', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('New Collection');
        await expect(page.getByRole('banner')).toContainText('Free shipping on orders over PKR 5000');

        const featured = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Featured Products' }) });
        await expect(productCard(page, PRODUCTS.shirt.name)).toBeVisible();
        // Only featured, active, in-stock products.
        await expect(featured.getByRole('heading', { name: PRODUCTS.chinos.name })).toHaveCount(0);
        await expect(featured.getByRole('heading', { name: PRODUCTS.hidden.name })).toHaveCount(0);
    });

    test('links to every department', async ({ page }) => {
        await page.goto('/');
        const nav = page.getByRole('navigation').first();
        for (const [name, path] of [['Women', '/women'], ['Men', '/men'], ['Accessories', '/accessories'], ['Sale', '/sale']]) {
            await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', path);
        }
    });
});

test.describe('department pages', () => {
    test('Men lists only men\'s active, in-stock products', async ({ page }) => {
        await page.goto('/men');
        await expect(page.getByRole('heading', { level: 1, name: 'Men' })).toBeVisible();
        await expect(productCard(page, PRODUCTS.shirt.name)).toBeVisible();
        await expect(productCard(page, PRODUCTS.chinos.name)).toBeVisible();
        await expect(page.getByText('2 products', { exact: true })).toBeVisible();
        await expect(productCard(page, PRODUCTS.soldOut.name)).toHaveCount(0);
        await expect(productCard(page, PRODUCTS.hidden.name)).toHaveCount(0);
        await expect(productCard(page, PRODUCTS.sale.name)).toHaveCount(0);
    });

    test('Men can be narrowed to a sub-category', async ({ page }) => {
        await page.goto('/men');
        await expect(productCard(page, PRODUCTS.chinos.name)).toBeVisible();
        await page.getByRole('button', { name: 'Shirts', exact: true }).click();
        await expect(page.getByText('1 product', { exact: true })).toBeVisible();
        await expect(productCard(page, PRODUCTS.shirt.name)).toBeVisible();
        await expect(productCard(page, PRODUCTS.chinos.name)).toHaveCount(0);
    });

    test('Women shows the sale badge and original price', async ({ page }) => {
        await page.goto('/women');
        await expect(page.getByText('3 products', { exact: true })).toBeVisible();
        const dress = productCard(page, PRODUCTS.sale.name);
        await expect(dress).toContainText('-20%');
        await expect(dress).toContainText(pkr(PRODUCTS.sale.price));
        await expect(dress).toContainText(pkr(PRODUCTS.sale.originalPrice));
    });

    test('Accessories and Sale list their products', async ({ page }) => {
        await page.goto('/accessories');
        await expect(productCard(page, PRODUCTS.belt.name)).toBeVisible();
        await expect(page.getByText('1 product', { exact: true })).toBeVisible();

        await page.goto('/sale');
        await expect(productCard(page, PRODUCTS.sale.name)).toBeVisible();
        await expect(productCard(page, PRODUCTS.belt.name)).toBeVisible();
        await expect(productCard(page, PRODUCTS.shirt.name)).toHaveCount(0);
    });
});

test.describe('all products', () => {
    test('lists active products and never hidden ones', async ({ page }) => {
        await page.goto('/products');
        await expect(page.getByRole('heading', { level: 1, name: 'All Products' })).toBeVisible();
        for (const key of ['overcoat', 'chinos', 'belt', 'floral', 'shirt', 'soldOut', 'sale', 'lowStock'] as const) {
            await expect(productCard(page, PRODUCTS[key].name)).toBeVisible();
        }
        await expect(productCard(page, PRODUCTS.hidden.name)).toHaveCount(0);
    });

    test('filters by category', async ({ page }) => {
        await page.goto('/products');
        await page.getByRole('checkbox', { name: 'Dresses' }).check();
        await expect(page).toHaveURL(/categories=Dresses/);
        await expect(productCard(page, PRODUCTS.sale.name)).toBeVisible();
        await expect(page.getByText('1 products found')).toBeVisible();
    });

    test('filters by price range', async ({ page }) => {
        await page.goto('/products');
        await page.getByLabel('Minimum price').fill('3000');
        await page.getByLabel('Maximum price').fill('4000');
        await page.getByRole('button', { name: 'Apply Price' }).click();
        await expect(page).toHaveURL(/minPrice=3000&maxPrice=4000/);
        await expect(productCard(page, PRODUCTS.shirt.name)).toBeVisible();
        await expect(productCard(page, PRODUCTS.sale.name)).toBeVisible();
        await expect(productCard(page, PRODUCTS.belt.name)).toHaveCount(0);
        await expect(productCard(page, PRODUCTS.overcoat.name)).toHaveCount(0);
    });

    test('sorts by price', async ({ page }) => {
        await page.goto('/products');
        await page.getByLabel('Sort by').selectOption('price_asc');
        await expect(page).toHaveURL(/sort=price_asc/);
        const names = page.getByRole('article').getByRole('heading');
        await expect(names.first()).toHaveText(PRODUCTS.lowStock.name); // PKR 2,500 is the cheapest
        await page.getByLabel('Sort by').selectOption('price_desc');
        await expect(names.first()).toHaveText(PRODUCTS.overcoat.name); // PKR 12,990
    });

    test('navbar search finds products by name', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Search', exact: true }).click();
        const box = page.getByRole('searchbox', { name: 'Search products' });
        await box.fill('linen');
        await box.press('Enter');
        await expect(page).toHaveURL(/\/products\?search=linen/);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for “linen”');
        await expect(productCard(page, PRODUCTS.sale.name)).toBeVisible();
        await expect(page.getByText('1 products found')).toBeVisible();
    });

    test('search with no matches says so', async ({ page }) => {
        await page.goto('/products?search=zzz-no-such-item');
        await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
    });
});

test.describe('product page', () => {
    test('shows price, sizes, colours and description', async ({ page }) => {
        await page.goto(productPath('shirt'));
        await expect(page).toHaveTitle(`${PRODUCTS.shirt.name} | Closet By Era`);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(PRODUCTS.shirt.name);
        await expect(page.getByText(pkr(PRODUCTS.shirt.price), { exact: true }).first()).toBeVisible();
        for (const size of ['S', 'M', 'L']) {
            await expect(page.getByRole('group', { name: 'Size' }).getByRole('button', { name: size, exact: true })).toBeVisible();
        }
        await expect(page.getByRole('group', { name: 'Color' }).getByRole('button', { name: 'White' })).toHaveAttribute('aria-pressed', 'true');
        await page.getByRole('group', { name: 'Color' }).getByRole('button', { name: 'Blue' }).click();
        await expect(page.getByText('Color: Blue')).toBeVisible();
        await expect(page.getByText('Crisp cotton oxford shirt.').first()).toBeVisible();
    });

    test('add-to-cart price follows the quantity', async ({ page }) => {
        await page.goto(productPath('shirt'));
        await page.getByRole('button', { name: 'Increase quantity' }).click();
        await page.getByRole('button', { name: 'Increase quantity' }).click();
        await expect(page.getByTestId('quantity-value')).toHaveText('3');
        await expect(page.getByRole('button', { name: `Add to Cart — ${pkr(PRODUCTS.shirt.price * 3)}` })).toBeVisible();
        await page.getByRole('button', { name: 'Decrease quantity' }).click();
        await expect(page.getByTestId('quantity-value')).toHaveText('2');
    });

    test('a sale product shows the saving', async ({ page }) => {
        await page.goto(productPath('sale'));
        await expect(page.getByText('Save 20%')).toBeVisible();
        await expect(page.getByText(pkr(PRODUCTS.sale.originalPrice), { exact: true }).first()).toBeVisible();
    });

    test('a sold-out product cannot be added to the cart', async ({ page }) => {
        await page.goto(productPath('soldOut'));
        await expect(page.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
    });

    test('a hidden product is not found', async ({ page }) => {
        await page.goto(productPath('hidden'));
        await expectNotFound(page);
    });

    test('a product without a slug opens by id', async ({ page }) => {
        await page.goto(productPath('floral'));
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(PRODUCTS.floral.name);
    });

    test('the category link opens a real page', async ({ page }) => {
        await page.goto(productPath('shirt'));
        await page.getByRole('link', { name: 'Shirts', exact: true }).click();
        await expect(page).toHaveURL(/\/products\?categories=Shirts/);
        await expect(productCard(page, PRODUCTS.shirt.name)).toBeVisible();

        await page.goto(productPath('overcoat'));
        await page.getByRole('link', { name: 'Women', exact: true }).last().click();
        await expect(page).toHaveURL(/\/women$/);
    });

    test('recently viewed lists other products you opened', async ({ page }) => {
        await page.goto(productPath('shirt'));
        await page.goto(productPath('sale'));
        const recent = page.getByRole('region', { name: 'Recently Viewed' });
        await expect(recent.getByRole('link', { name: new RegExp(PRODUCTS.shirt.name) })).toBeVisible();
        await expect(recent.getByRole('link', { name: new RegExp(PRODUCTS.sale.name) })).toHaveCount(0);
    });

    test('unknown products show the not-found page', async ({ page }) => {
        await page.goto('/product/no-such-product');
        await expectNotFound(page);
    });
});
