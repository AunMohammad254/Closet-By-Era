import { test, expect } from '@playwright/test';

test('Full Checkout Flow - Product Selection to Payment Email', async ({ page, request }) => {
  // Wait for Maildev and Next to be up completely
  await page.waitForTimeout(2000);

  // Set up the cart state directly in local storage since the DB is not seeded
  await page.goto('/');
  await page.evaluate(() => {
    const CART_STORAGE_KEY = 'closet-by-era-cart';
    const dummyCart = [
      {
        id: '123',
        productId: 'prod_1',
        name: 'Test E2E Product',
        price: 5000,
        quantity: 1,
        image_url: null,
        size: 'M',
        color: 'Black'
      }
    ];
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dummyCart));
  });

  await page.goto('/checkout');

  await expect(page.locator('h2', { hasText: 'Contact Information' })).toBeVisible({ timeout: 10000 });

  await page.fill('input[name="email"]', 'test@closetbyera.com');
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[name="phone"]', '+923001234567');
  await page.fill('input[name="address"]', '123 Test St');
  await page.fill('input[name="city"]', 'Test City');

  await page.click('button:has-text("Continue")');
  await expect(page.locator('h2', { hasText: 'Shipping Method' })).toBeVisible();

  await page.click('button:has-text("Continue")');
  await expect(page.locator('h2', { hasText: 'Payment Method' })).toBeVisible();

  await expect(page.locator('input[value="cod"]')).toBeChecked();

  // Submit order.
  const placeOrderBtn = page.locator('button:has-text("Place Order")');
  await expect(placeOrderBtn).toBeVisible();
  await placeOrderBtn.click();

  // Verify UI Success Page
  await expect(page.locator('text="Order Confirmed!"')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text="ORD-MOCK1234"')).toBeVisible();

  // Poll maildev API to verify it received the email
  let found = false;
  let emailData = null;
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const mailRes = await request.get('http://localhost:1080/api/email');
    if (mailRes.status() === 200) {
      const emails = await mailRes.json();
      if (emails.length > 0) {
        found = true;
        emailData = emails[0];
        break;
      }
    }
  }

  expect(found).toBe(true);
  expect(emailData.subject).toContain('Order Confirmation - ORD-MOCK1234');
  expect(emailData.to[0].address).toBe('test@closetbyera.com');

  // Clean up maildev inbox
  await request.delete('http://localhost:1080/api/email/all');
});
