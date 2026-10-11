import 'server-only';

import Stripe from 'stripe';

/**
 * Stripe is wired for TEST MODE (Stripe cannot pay out to Pakistani
 * businesses). Live keys are ignored unless STRIPE_ALLOW_LIVE=true, so a
 * pasted live key can never charge real cards by accident.
 *
 *   STRIPE_SECRET_KEY      sk_test_... (Dashboard > Developers > API keys)
 *   STRIPE_WEBHOOK_SECRET  whsec_...   (webhook endpoint /api/webhooks/stripe)
 */

export type StripeMode = 'test' | 'live' | 'live_blocked' | 'missing';

export function getStripeMode(): StripeMode {
    const key = process.env.STRIPE_SECRET_KEY ?? '';
    if (/^(sk|rk)_test_/.test(key)) return 'test';
    if (/^(sk|rk)_live_/.test(key)) return process.env.STRIPE_ALLOW_LIVE === 'true' ? 'live' : 'live_blocked';
    return 'missing';
}

let client: Stripe | null = null;

/** The Stripe client, or null when card payments are not configured. */
export function getStripe(): Stripe | null {
    const mode = getStripeMode();
    if (mode !== 'test' && mode !== 'live') return null;
    client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, { appInfo: { name: 'Closet By Era' } });
    return client;
}

/** Card checkout needs both the API key and the webhook secret (to learn about payments). */
export function isCardPaymentReady(): boolean {
    return getStripe() !== null && !!process.env.STRIPE_WEBHOOK_SECRET;
}
