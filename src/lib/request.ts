import 'server-only';

import { headers } from 'next/headers';
import { getSiteUrl } from '@/lib/site-url';

/** Best-effort client IP for rate limiting (first hop of x-forwarded-for). */
export async function getClientIp(): Promise<string> {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return h.get('x-real-ip') ?? 'unknown';
}

/**
 * Origin the current request was made to, so redirects (e.g. back from
 * Stripe) return to the same deployment: production, a preview or localhost.
 */
export async function getRequestOrigin(): Promise<string> {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (!host) return getSiteUrl();
    const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    const proto = h.get('x-forwarded-proto') ?? (local ? 'http' : 'https');
    return `${proto}://${host}`;
}
