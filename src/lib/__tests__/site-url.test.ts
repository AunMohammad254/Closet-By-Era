import { getSiteUrl } from '../site-url';

describe('site-url', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('returns NEXT_PUBLIC_SITE_URL without trailing slash if set', () => {
        process.env.NEXT_PUBLIC_SITE_URL = 'https://custom-domain.com///';
        expect(getSiteUrl()).toBe('https://custom-domain.com');
    });

    it('falls back to VERCEL_PROJECT_PRODUCTION_URL if NEXT_PUBLIC_SITE_URL is unset', () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;
        process.env.VERCEL_PROJECT_PRODUCTION_URL = 'closet-by-era.vercel.app';
        expect(getSiteUrl()).toBe('https://closet-by-era.vercel.app');
    });

    it('falls back to VERCEL_URL if production URL is unset', () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
        process.env.VERCEL_URL = 'branch-deploy.vercel.app';
        expect(getSiteUrl()).toBe('https://branch-deploy.vercel.app');
    });

    it('defaults to http://localhost:3000 if no env vars are defined', () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
        delete process.env.VERCEL_URL;
        expect(getSiteUrl()).toBe('http://localhost:3000');
    });
});
