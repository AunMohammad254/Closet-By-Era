import { canOptimizeImage, isDisplayableImage, shimmerPlaceholder } from '../imageUtils';

describe('imageUtils', () => {
    describe('isDisplayableImage', () => {
        it('returns false for null, undefined or empty string', () => {
            expect(isDisplayableImage(null)).toBe(false);
            expect(isDisplayableImage(undefined)).toBe(false);
            expect(isDisplayableImage('')).toBe(false);
        });

        it('returns true for same-site paths', () => {
            expect(isDisplayableImage('/images/product.jpg')).toBe(true);
            expect(isDisplayableImage('/icons/logo.png')).toBe(true);
        });

        it('returns true for http and https URLs', () => {
            expect(isDisplayableImage('http://example.com/pic.jpg')).toBe(true);
            expect(isDisplayableImage('https://images.unsplash.com/photo-123')).toBe(true);
        });

        it('returns false for dangerous or non-http protocols', () => {
            expect(isDisplayableImage('javascript:alert(1)')).toBe(false);
            expect(isDisplayableImage('data:text/html,<script>')).toBe(false);
        });
    });

    describe('shimmerPlaceholder', () => {
        it('generates a valid data SVG base64 string', () => {
            const placeholder = shimmerPlaceholder(100, 100);
            expect(placeholder).toMatch(/^data:image\/svg\+xml;base64,/);
        });
    });

    describe('canOptimizeImage', () => {
        it('returns true for relative same-site paths', () => {
            expect(canOptimizeImage('/products/jacket.jpg')).toBe(true);
        });

        it('returns true for allowed external domains', () => {
            expect(canOptimizeImage('https://www.closetbyera.com/hero.jpg')).toBe(true);
            expect(canOptimizeImage('https://images.unsplash.com/photo-abc')).toBe(true);
        });

        it('handles Supabase storage paths for allowed origins', () => {
            expect(canOptimizeImage('https://hdheoblrrnaejqalsmcg.supabase.co/storage/v1/object/public/products/1.jpg')).toBe(true);
            expect(canOptimizeImage('https://hdheoblrrnaejqalsmcg.supabase.co/other-path/1.jpg')).toBe(false);
        });

        it('returns false for random external hosts or invalid URLs', () => {
            expect(canOptimizeImage('https://random-untrusted-site.com/image.png')).toBe(false);
            expect(canOptimizeImage('not-a-valid-url:::')).toBe(false);
        });
    });
});
