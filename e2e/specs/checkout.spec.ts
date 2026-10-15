/**
 * End-to-end checkout suite: information step, shipping options, coupon/giftcard application,
 * Cash on Delivery and alternative payment flows, and order database persistence.
 */
import { test, expect } from '../fixtures';
import { COUPONS, PRODUCTS } from '../data';
import {
    addToCart,
    fillCheckoutInformation,
    continueToPayment,
    applyCheckoutCode,
    placeOrder,
    confirmedOrderNumber,
} from '../helpers/shop';
import { one, sql } from '../helpers/db';

test.describe('checkout flow', () => {
    test('guest attempting checkout is redirected to login with redirect param', async ({ page }) => {
        await addToCart(page, 'belt');
        await page.goto('/checkout');
        await expect(page).toHaveURL(/\/auth\/login\?redirectedFrom=%2Fcheckout/);
    });

    test('signed-in shopper completes Cash on Delivery order with coupon applied', async ({ shopper, page }) => {
        await addToCart(page, 'shirt', { size: 'M' });
        await fillCheckoutInformation(page, shopper);
        await continueToPayment(page, 'standard');

        // Apply 10% coupon
        await applyCheckoutCode(page, COUPONS.tenPercent);

        // Place order with Cash on Delivery
        await placeOrder(page, 'Cash on Delivery');

        // Verify order confirmation screen
        const orderNumber = await confirmedOrderNumber(page);

        // Verify database records
        const order = await one<{
            order_number: string;
            status: string;
            payment_method: string;
            payment_status: string;
            total_amount: number;
        }>(
            'select order_number, status, payment_method, payment_status, total_amount from public.orders where order_number = $1',
            [orderNumber]
        );

        expect(order.order_number).toBe(orderNumber);
        expect(order.status).toBe('pending');
        expect(order.payment_method).toBe('cod');
        expect(order.payment_status).toBe('pending');
        expect(Number(order.total_amount)).toBeGreaterThan(0);

        // Verify order items exist in DB
        const items = await sql<{ product_id: string; quantity: number }>(
            'select oi.product_id, oi.quantity from public.order_items oi join public.orders o on oi.order_id = o.id where o.order_number = $1',
            [orderNumber]
        );
        expect(items.length).toBe(1);
        expect(items[0].product_id).toBe(PRODUCTS.shirt.id);
        expect(items[0].quantity).toBe(1);
    });

    test('express shipping surcharge is added to the order total', async ({ shopper, page }) => {
        await addToCart(page, 'belt');
        await fillCheckoutInformation(page, shopper);
        await continueToPayment(page, 'express');

        await placeOrder(page, 'Cash on Delivery');
        const orderNumber = await confirmedOrderNumber(page);

        const order = await one<{ shipping_cost: number }>(
            'select shipping_cost from public.orders where order_number = $1',
            [orderNumber]
        );
        // Standard (500) + Express surcharge (300) = 800
        expect(Number(order.shipping_cost)).toBe(800);
    });

    test('bank transfer displays payment instructions upon confirmation', async ({ shopper, page }) => {
        await addToCart(page, 'chinos');
        await fillCheckoutInformation(page, shopper);
        await continueToPayment(page, 'standard');

        await placeOrder(page, 'Bank Transfer');
        const orderNumber = await confirmedOrderNumber(page);

        // Instructions heading should be visible
        await expect(page.getByRole('heading', { name: /Complete your payment/i })).toBeVisible();
        await expect(page.getByTestId('order-number')).toHaveText(orderNumber);
    });
});
