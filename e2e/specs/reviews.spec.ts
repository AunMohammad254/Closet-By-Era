/**
 * Product reviews and ratings: form validation, rating stars, submission,
 * and customer feedback.
 */
import { test, expect } from '../fixtures';
import { productPath } from '../data';

test.describe('product reviews', () => {
    test('requires a star rating before submission', async ({ page }) => {
        await page.goto(productPath('shirt'));
        await expect(page.getByRole('heading', { name: 'Customer Reviews' })).toBeVisible();

        // Fill review comment without selecting star rating
        await page.getByPlaceholder('Tell us what you liked about this product...').fill('Great quality shirt!');
        await page.getByRole('button', { name: 'Submit Review' }).click();

        await expect(page.getByText('Please select a rating')).toBeVisible();
    });

    test('signed-in shopper submits review successfully', async ({ shopper, page }) => {
        void shopper;
        await page.goto(productPath('shirt'));

        // Pick 5-star rating (first star button in the group)
        const stars = page.locator('form').getByRole('button', { name: '★' });
        await stars.nth(4).click();

        // Fill review text
        await page.getByPlaceholder('Tell us what you liked about this product...').fill('Excellent fit and breathable fabric.');
        await page.getByRole('button', { name: 'Submit Review' }).click();

        // Verify feedback message
        await expect(page.getByText(/Your review will appear once it has been approved/i)).toBeVisible();
    });
});
