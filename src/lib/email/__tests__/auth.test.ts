/** @jest-environment node */
jest.mock('server-only', () => ({}));

import { AuthEmailHookSchema, buildAuthEmails } from '../auth';

process.env.NEXT_PUBLIC_SITE_URL = 'https://shop.example';

const payload = (emailData: Record<string, unknown>, user: Record<string, unknown> = {}) =>
    AuthEmailHookSchema.parse({
        user: { email: 'current@example.com', user_metadata: { first_name: 'Ayesha' }, ...user },
        email_data: {
            token: '123456',
            token_hash: 'hash-main',
            redirect_to: 'https://shop.example/account',
            site_url: 'https://shop.example',
            token_new: '',
            token_hash_new: '',
            ...emailData,
        },
    });

const linkIn = (html: string) => {
    const match = html.match(/href="(https:\/\/shop\.example\/auth\/confirm\?[^"]+)"/);
    return match ? new URL(match[1].replace(/&amp;/g, '&')) : null;
};

describe('buildAuthEmails', () => {
    it('sends sign-up confirmation to our /auth/confirm with the token hash', () => {
        const [email] = buildAuthEmails(payload({ email_action_type: 'signup' }));
        expect(email.to).toBe('current@example.com');
        expect(email.subject).toBe('Confirm your email address');
        const link = linkIn(email.html)!;
        expect(link.searchParams.get('token_hash')).toBe('hash-main');
        expect(link.searchParams.get('type')).toBe('signup');
        expect(link.searchParams.get('next')).toBe('/account');
        expect(email.text).toContain('Hi Ayesha,');
    });

    it('sends password reset links on to the reset page', () => {
        const [email] = buildAuthEmails(payload({
            email_action_type: 'recovery',
            redirect_to: 'https://shop.example/auth/reset-password',
        }));
        const link = linkIn(email.html)!;
        expect(link.searchParams.get('type')).toBe('recovery');
        expect(link.searchParams.get('next')).toBe('/auth/reset-password');
    });

    it('sends two emails for a secure email change, with the hashes Supabase reverses', () => {
        const emails = buildAuthEmails(payload(
            { email_action_type: 'email_change', token_hash: 'for-new', token_hash_new: 'for-current' },
            { new_email: 'new@example.com' }
        ));
        expect(emails.map(e => e.to)).toEqual(['current@example.com', 'new@example.com']);
        expect(linkIn(emails[0].html)!.searchParams.get('token_hash')).toBe('for-current');
        expect(linkIn(emails[1].html)!.searchParams.get('token_hash')).toBe('for-new');
    });

    it('sends one email to the new address when secure email change is off', () => {
        const emails = buildAuthEmails(payload(
            { email_action_type: 'email_change', token_hash: 'only-hash' },
            { new_email: 'new@example.com' }
        ));
        expect(emails).toHaveLength(1);
        expect(emails[0].to).toBe('new@example.com');
    });

    it('sends codes for reauthentication', () => {
        const [email] = buildAuthEmails(payload({ email_action_type: 'reauthentication' }));
        expect(email.html).toContain('123456');
        expect(email.subject).toBe('Your verification code');
    });

    it('warns both addresses when the email address changes', () => {
        const emails = buildAuthEmails(payload({ email_action_type: 'email_changed_notification', old_email: 'old@example.com' }));
        expect(emails.map(e => e.to)).toEqual(['current@example.com', 'old@example.com']);
        expect(emails[0].subject).toBe('Security notice: Your email address was changed');
        expect(emails[0].html).toContain('https://shop.example/auth/forgot-password');
    });

    it('escapes user-controlled names in the HTML', () => {
        const [email] = buildAuthEmails(payload(
            { email_action_type: 'signup' },
            { user_metadata: { first_name: '<img src=x onerror=alert(1)>' } }
        ));
        expect(email.html).not.toContain('<img src=x');
        expect(email.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('ignores redirect origins and keeps links on this site', () => {
        const [email] = buildAuthEmails(payload({
            email_action_type: 'magiclink',
            redirect_to: 'https://evil.example/steal',
        }));
        const link = linkIn(email.html)!;
        expect(link.origin).toBe('https://shop.example');
        expect(link.searchParams.get('next')).toBe('/steal');
    });
});
