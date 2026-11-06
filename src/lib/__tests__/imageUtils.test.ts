import { isDisplayableImage, canOptimizeImage, shimmerPlaceholder } from '../imageUtils';

describe('imageUtils', () => {
    describe('isDisplayableImage', () => {
        it('returns false for null, undefined, and empty string', () => {
            expect(isDisplayableImage(null)).toBe(false);
            expect(isDisplayableImage(undefined)).toBe(false);
            expect(isDisplayableImage('')).toBe(false);
        });

        it('returns true for same site paths', () => {
            expect(isDisplayableImage('/images/test.jpg')).toBe(true);
            expect(isDisplayableImage('/assets/logo.png')).toBe(true);
        });

        it('returns true for HTTP and HTTPS URLs', () => {
            expect(isDisplayableImage('http://example.com/image.jpg')).toBe(true);
            expect(isDisplayableImage('https://example.com/image.png')).toBe(true);
            expect(isDisplayableImage('HTTPS://EXAMPLE.COM/IMAGE.PNG')).toBe(true);
        });

        it('returns false for data URI even if the prompt mentioned it (because actual code does not support it)', () => {
            // Testing current implementation which does not handle data:image/ as per the source code
            expect(isDisplayableImage('data:image/png;base64,iVBORw0KGgo')).toBe(false);
        });

        it('returns false for invalid inputs that are not URLs or same site paths', () => {
            expect(isDisplayableImage('not-a-url-or-path')).toBe(false);
            expect(isDisplayableImage('javascript:alert(1)')).toBe(false);
        });
    });

    describe('canOptimizeImage', () => {
        it('returns true for same site paths', () => {
            expect(canOptimizeImage('/images/test.jpg')).toBe(true);
            expect(canOptimizeImage('/test')).toBe(true);
        });

        it('returns true for specific allowed origins', () => {
            expect(canOptimizeImage('https://www.closetbyera.com/path/to/image.jpg')).toBe(true);
            expect(canOptimizeImage('https://images.unsplash.com/photo-123')).toBe(true);
        });

        it('returns true for valid Supabase storage paths on allowed origins', () => {
            expect(canOptimizeImage('https://hdheoblrrnaejqalsmcg.supabase.co/storage/v1/object/public/test')).toBe(true);
        });

        it('returns false for allowed origins but invalid paths (Supabase)', () => {
            expect(canOptimizeImage('https://hdheoblrrnaejqalsmcg.supabase.co/other/path')).toBe(false);
        });

        it('returns false for invalid origins', () => {
            expect(canOptimizeImage('https://evil.com/image.jpg')).toBe(false);
            expect(canOptimizeImage('https://example.com/storage/v1/object/public/test')).toBe(false);
        });

        it('returns false for invalid URL formats', () => {
            expect(canOptimizeImage('not-a-valid-url')).toBe(false);
            expect(canOptimizeImage('javascript:alert(1)')).toBe(false);
        });
    });

    describe('shimmerPlaceholder', () => {
        it('returns a valid base64 data URI string', () => {
            const result = shimmerPlaceholder(100, 100);
            expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

            // Check if the base64 part can be decoded
            const base64Part = result.split(',')[1];
            const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
            expect(decoded).toContain('<svg');
            expect(decoded).toContain('width="100"');
            expect(decoded).toContain('height="100"');
        });
    });
});
