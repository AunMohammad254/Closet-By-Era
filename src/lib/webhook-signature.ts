import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a Standard Webhooks signature (https://www.standardwebhooks.com),
 * the scheme Supabase Auth hooks use.
 *
 * @param secret  As shown by Supabase: `v1,whsec_<base64>`. Several secrets may
 *                be separated by `|` while rotating.
 * @param toleranceSeconds Reject messages older (or newer) than this, to stop replays.
 */
export function verifyStandardWebhook(
    body: string,
    headers: { id: string | null; timestamp: string | null; signature: string | null },
    secret: string,
    { toleranceSeconds = 300, now = Date.now() }: { toleranceSeconds?: number; now?: number } = {}
): boolean {
    const { id, timestamp, signature } = headers;
    if (!id || !timestamp || !signature) return false;

    const sentAt = Number(timestamp);
    if (!Number.isInteger(sentAt) || Math.abs(now / 1000 - sentAt) > toleranceSeconds) return false;

    const signedContent = `${id}.${timestamp}.${body}`;
    const provided = signature
        .split(' ')
        .map(part => part.split(','))
        .filter(([version, value]) => version === 'v1' && value)
        .map(([, value]) => Buffer.from(value, 'base64'));

    return secret.split('|').some(raw => {
        const key = Buffer.from(raw.trim().replace(/^v1,/, '').replace(/^whsec_/, ''), 'base64');
        if (!key.length) return false;
        const expected = createHmac('sha256', key).update(signedContent).digest();
        return provided.some(sig => sig.length === expected.length && timingSafeEqual(sig, expected));
    });
}
