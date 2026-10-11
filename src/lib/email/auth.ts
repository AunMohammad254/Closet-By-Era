import 'server-only';

import { z } from 'zod';
import { getSiteUrl } from '@/lib/site-url';
import type { EmailMessage } from './transport';
import {
    button, callout, code, heading, linkFallback, note, paragraph, renderEmail, richParagraph, strong,
} from './layout';

/**
 * Builds Supabase Auth emails (Send Email hook) with the shared layout.
 * Links point at /auth/confirm on this site, which verifies the token on the
 * server, so they work on any device (no PKCE verifier needed).
 */

export const AuthEmailHookSchema = z.object({
    user: z.object({
        email: z.string().email(),
        new_email: z.string().optional(),
        user_metadata: z.record(z.string(), z.unknown()).optional(),
    }).passthrough(),
    email_data: z.object({
        token: z.string().default(''),
        token_hash: z.string().default(''),
        redirect_to: z.string().default(''),
        email_action_type: z.string(),
        site_url: z.string().default(''),
        token_new: z.string().default(''),
        token_hash_new: z.string().default(''),
        old_email: z.string().optional(),
        provider: z.string().optional(),
        factor_type: z.string().optional(),
    }).passthrough(),
});

export type AuthEmailHookPayload = z.infer<typeof AuthEmailHookSchema>;

/** Token types /auth/confirm accepts (supabase.auth.verifyOtp email types). */
export const VERIFY_TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] as const;
export type VerifyType = (typeof VERIFY_TYPES)[number];

/** Path (with query) to land on after confirming; only same-site paths. */
function nextPath(redirectTo: string, fallback: string): string {
    try {
        const url = new URL(redirectTo);
        const path = `${url.pathname}${url.search}`;
        return path === '/' ? fallback : path;
    } catch {
        return fallback;
    }
}

export function confirmUrl(tokenHash: string, type: VerifyType, next: string): string {
    const params = new URLSearchParams({ token_hash: tokenHash, type, next });
    return `${getSiteUrl()}/auth/confirm?${params.toString()}`;
}

const greeting = (payload: AuthEmailHookPayload) => {
    const first = payload.user.user_metadata?.first_name;
    return typeof first === 'string' && first.trim() ? `Hi ${first.trim()},` : 'Hi,';
};

function message(to: string, subject: string, preheader: string, body: string, text: string): EmailMessage {
    return { to, subject, html: renderEmail({ preheader, body }), text };
}

function linkEmail(opts: {
    to: string; subject: string; title: string; intro: string; action: string; url: string; footer: string; hello: string;
}): EmailMessage {
    const body = [
        heading(opts.title),
        paragraph(opts.hello),
        paragraph(opts.intro),
        button(opts.url, opts.action),
        linkFallback(opts.url),
        note(opts.footer),
    ].join('');
    return message(opts.to, opts.subject, opts.intro, body, `${opts.hello}\n\n${opts.intro}\n\n${opts.action}: ${opts.url}\n\n${opts.footer}`);
}

function codeEmail(to: string, subject: string, title: string, intro: string, token: string, hello: string): EmailMessage {
    const body = [heading(title), paragraph(hello), paragraph(intro), code(token), note('The code expires soon. If you did not request it, you can ignore this email.')].join('');
    return message(to, subject, `${intro} ${token}`, body, `${hello}\n\n${intro}\n\n${token}`);
}

const NOTICES: Record<string, { subject: string; title: string; detail: (d: AuthEmailHookPayload['email_data']) => string }> = {
    password_changed_notification: {
        subject: 'Your password was changed',
        title: 'Your password was changed',
        detail: () => 'The password for your Closet By Era account was just changed.',
    },
    email_changed_notification: {
        subject: 'Your email address was changed',
        title: 'Your email address was changed',
        detail: () => 'The email address on your Closet By Era account was just changed.',
    },
    phone_changed_notification: {
        subject: 'Your phone number was changed',
        title: 'Your phone number was changed',
        detail: () => 'The phone number on your Closet By Era account was just changed.',
    },
    identity_linked_notification: {
        subject: 'A sign-in method was added',
        title: 'New sign-in method added',
        detail: d => `${d.provider ? `${d.provider} sign-in` : 'A new sign-in method'} was linked to your account.`,
    },
    identity_unlinked_notification: {
        subject: 'A sign-in method was removed',
        title: 'Sign-in method removed',
        detail: d => `${d.provider ? `${d.provider} sign-in` : 'A sign-in method'} was removed from your account.`,
    },
    mfa_factor_enrolled_notification: {
        subject: 'Two-factor authentication was added',
        title: 'Two-factor authentication added',
        detail: d => `A ${d.factor_type?.toUpperCase() || 'two-factor'} method was added to your account.`,
    },
    mfa_factor_unenrolled_notification: {
        subject: 'Two-factor authentication was removed',
        title: 'Two-factor authentication removed',
        detail: d => `A ${d.factor_type?.toUpperCase() || 'two-factor'} method was removed from your account.`,
    },
};

function securityNotice(to: string, kind: string, payload: AuthEmailHookPayload, hello: string): EmailMessage {
    const notice = NOTICES[kind];
    const detail = notice.detail(payload.email_data);
    const resetUrl = `${getSiteUrl()}/auth/forgot-password`;
    const body = [
        heading(notice.title),
        paragraph(hello),
        paragraph(detail),
        callout(richParagraph(`${strong('Was this not you?')} Reset your password now and contact us, so we can secure your account.`), 'warning'),
        button(resetUrl, 'Reset password'),
        note('If you made this change, no action is needed.'),
    ].join('');
    return message(to, `Security notice: ${notice.subject}`, detail, body, `${hello}\n\n${detail}\n\nNot you? Reset your password: ${resetUrl}`);
}

/** The emails to send for one hook event (email change can need two). */
export function buildAuthEmails(payload: AuthEmailHookPayload): EmailMessage[] {
    const { user, email_data: d } = payload;
    const hello = greeting(payload);
    const type = d.email_action_type;
    const next = (fallback: string) => nextPath(d.redirect_to, fallback);

    switch (type) {
        case 'signup':
            return [linkEmail({
                to: user.email, hello,
                subject: 'Confirm your email address',
                title: 'Confirm your email address',
                intro: 'Thanks for joining Closet By Era. Confirm your email address to activate your account.',
                action: 'Confirm email',
                url: confirmUrl(d.token_hash, 'signup', next('/account')),
                footer: 'If you did not create an account, you can ignore this email.',
            })];
        case 'invite':
            return [linkEmail({
                to: user.email, hello,
                subject: 'You have been invited to Closet By Era',
                title: 'You have been invited',
                intro: 'You have been invited to create a Closet By Era account. Accept the invitation, then choose a password.',
                action: 'Accept invitation',
                url: confirmUrl(d.token_hash, 'invite', next('/auth/reset-password')),
                footer: 'If you were not expecting this invitation, you can ignore this email.',
            })];
        case 'magiclink':
            return [linkEmail({
                to: user.email, hello,
                subject: 'Your sign-in link',
                title: 'Sign in to Closet By Era',
                intro: 'Use the button below to sign in. The link works once and expires soon.',
                action: 'Sign in',
                url: confirmUrl(d.token_hash, 'magiclink', next('/account')),
                footer: 'If you did not try to sign in, you can ignore this email.',
            })];
        case 'recovery':
            return [linkEmail({
                to: user.email, hello,
                subject: 'Reset your password',
                title: 'Reset your password',
                intro: 'We received a request to reset your password. Use the button below to choose a new one. The link expires soon.',
                action: 'Reset password',
                url: confirmUrl(d.token_hash, 'recovery', next('/auth/reset-password')),
                footer: 'If you did not ask to reset your password, you can ignore this email. Your password stays the same.',
            })];
        case 'email_change': {
            const newEmail = user.new_email || '';
            const toNew = (hash: string) => linkEmail({
                to: newEmail, hello,
                subject: 'Confirm your new email address',
                title: 'Confirm your new email address',
                intro: `Confirm ${newEmail} as the new email address for your Closet By Era account.`,
                action: 'Confirm new email',
                url: confirmUrl(hash, 'email_change', next('/account')),
                footer: 'If you did not request this change, you can ignore this email.',
            });
            // Secure email change: both addresses must confirm. Supabase's
            // field names are reversed: token_hash_new belongs to the CURRENT address.
            if (d.token_hash && d.token_hash_new) {
                return [
                    linkEmail({
                        to: user.email, hello,
                        subject: 'Confirm your email address change',
                        title: 'Confirm your email address change',
                        intro: `Someone asked to change the email address on your account to ${newEmail}. Confirm to approve the change.`,
                        action: 'Approve change',
                        url: confirmUrl(d.token_hash_new, 'email_change', next('/account')),
                        footer: 'If you did not request this, do not click the button, and reset your password.',
                    }),
                    toNew(d.token_hash),
                ];
            }
            return newEmail ? [toNew(d.token_hash || d.token_hash_new)] : [];
        }
        case 'email':
            return [codeEmail(user.email, 'Your sign-in code', 'Your sign-in code', 'Enter this code to sign in:', d.token, hello)];
        case 'reauthentication':
            return [codeEmail(user.email, 'Your verification code', 'Confirm it is you', 'Enter this code to confirm the change to your account:', d.token, hello)];
        default:
            if (type in NOTICES) {
                // Warn the old address too, in case the account was taken over.
                const recipients = [user.email, type === 'email_changed_notification' ? d.old_email : undefined]
                    .filter((e): e is string => !!e);
                return [...new Set(recipients)].map(to => securityNotice(to, type, payload, hello));
            }
            return d.token
                ? [codeEmail(user.email, 'Your verification code', 'Your verification code', 'Enter this code to continue:', d.token, hello)]
                : [];
    }
}
