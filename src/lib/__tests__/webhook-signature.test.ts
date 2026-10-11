/** @jest-environment node */
import { createHmac } from 'node:crypto';

jest.mock('server-only', () => ({}));

import { verifyStandardWebhook } from '../webhook-signature';

const keyBytes = Buffer.from('a-test-secret-for-standard-webhooks');
const secret = `v1,whsec_${keyBytes.toString('base64')}`;
const body = JSON.stringify({ user: { email: 'shopper@example.com' } });
const now = 1_790_000_000_000;
const timestamp = String(now / 1000);

function sign(content: string, key = keyBytes) {
    return `v1,${createHmac('sha256', key).update(content).digest('base64')}`;
}

const headers = (overrides: Partial<Record<'id' | 'timestamp' | 'signature', string | null>> = {}) => ({
    id: 'msg_123',
    timestamp,
    signature: sign(`msg_123.${timestamp}.${body}`),
    ...overrides,
});

describe('verifyStandardWebhook', () => {
    it('accepts a correctly signed request', () => {
        expect(verifyStandardWebhook(body, headers(), secret, { now })).toBe(true);
    });

    it('rejects a modified body', () => {
        expect(verifyStandardWebhook(body.replace('shopper', 'attacker'), headers(), secret, { now })).toBe(false);
    });

    it('rejects a signature made with another secret', () => {
        const forged = sign(`msg_123.${timestamp}.${body}`, Buffer.from('other-secret'));
        expect(verifyStandardWebhook(body, headers({ signature: forged }), secret, { now })).toBe(false);
    });

    it('rejects old (replayed) requests', () => {
        const fiveMinutesLater = now + 6 * 60 * 1000;
        expect(verifyStandardWebhook(body, headers(), secret, { now: fiveMinutesLater })).toBe(false);
    });

    it('rejects missing headers', () => {
        expect(verifyStandardWebhook(body, headers({ signature: null }), secret, { now })).toBe(false);
        expect(verifyStandardWebhook(body, headers({ id: null }), secret, { now })).toBe(false);
    });

    it('accepts any of several signatures and any of several secrets (rotation)', () => {
        const signature = `v1,bm90LXRoaXM= ${sign(`msg_123.${timestamp}.${body}`)}`;
        const rotated = `v1,whsec_${Buffer.from('old').toString('base64')}|${secret}`;
        expect(verifyStandardWebhook(body, headers({ signature }), rotated, { now })).toBe(true);
    });
});
