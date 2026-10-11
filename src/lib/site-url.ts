/**
 * Public origin of the storefront, without a trailing slash.
 * NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is used.
 */
export function getSiteUrl(): string {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL;
    if (explicit) return explicit.replace(/\/+$/, '');
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    if (vercel) return `https://${vercel}`;
    return 'http://localhost:3000';
}
