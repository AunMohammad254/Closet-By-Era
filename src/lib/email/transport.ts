import 'server-only';

import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { logger } from '@/lib/logger';

/**
 * Provider-agnostic email sending. Every provider is plain SMTP through
 * Nodemailer, and all content comes from our own templates (src/lib/email),
 * so switching or adding a provider is configuration only.
 *
 * Providers are tried in EMAIL_PROVIDERS order (default: brevo, resend, smtp);
 * the next one is used when a send fails. Unconfigured providers are skipped.
 *
 *   brevo   BREVO_SMTP_LOGIN, BREVO_SMTP_KEY   (optional BREVO_SMTP_PORT, default 587)
 *   resend  RESEND_API_KEY                     (SMTP on smtp.resend.com:465)
 *   smtp    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE (any other provider)
 *
 * Sender: EMAIL_FROM / EMAIL_FROM_NAME (falls back to SMTP_FROM_EMAIL / SMTP_FROM_NAME).
 * The sender's domain must be verified with every provider you enable.
 */

export type EmailProviderId = 'brevo' | 'resend' | 'smtp';

const ALL_PROVIDERS: EmailProviderId[] = ['brevo', 'resend', 'smtp'];

export interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    text: string;
}

export interface EmailResult {
    success: boolean;
    provider?: EmailProviderId;
    messageId?: string;
    error?: string;
}

export interface SendOptions {
    /** Give up (across all providers) after this many ms. */
    deadlineMs?: number;
}

function providerOptions(id: EmailProviderId): SMTPTransport.Options | null {
    const env = process.env;
    switch (id) {
        case 'brevo': {
            if (!env.BREVO_SMTP_LOGIN || !env.BREVO_SMTP_KEY) return null;
            const port = Number(env.BREVO_SMTP_PORT) || 587;
            return {
                host: 'smtp-relay.brevo.com',
                port,
                secure: port === 465,
                auth: { user: env.BREVO_SMTP_LOGIN, pass: env.BREVO_SMTP_KEY },
            };
        }
        case 'resend':
            if (!env.RESEND_API_KEY) return null;
            return {
                host: 'smtp.resend.com',
                port: 465,
                secure: true,
                auth: { user: 'resend', pass: env.RESEND_API_KEY },
            };
        case 'smtp': {
            if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
            return {
                host: env.SMTP_HOST,
                port: Number(env.SMTP_PORT) || 587,
                secure: env.SMTP_SECURE === 'true',
                auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
            };
        }
    }
}

function requestedProviders(): EmailProviderId[] {
    const requested = (process.env.EMAIL_PROVIDERS || ALL_PROVIDERS.join(','))
        .split(',')
        .map(p => p.trim().toLowerCase())
        .filter((p): p is EmailProviderId => (ALL_PROVIDERS as string[]).includes(p));
    return [...new Set(requested)];
}

/** Providers that are configured, in the order they will be tried. */
export function getEmailProviders(): EmailProviderId[] {
    return requestedProviders().filter(id => providerOptions(id) !== null);
}

/** Requested providers in order, and whether each has credentials (for admin status). */
export function describeEmailProviders(): { id: EmailProviderId; configured: boolean }[] {
    return requestedProviders().map(id => ({ id, configured: providerOptions(id) !== null }));
}

export function getSender(): { name: string; address: string } {
    const env = process.env;
    return {
        name: env.EMAIL_FROM_NAME || env.SMTP_FROM_NAME || 'Closet By Era',
        address: env.EMAIL_FROM || env.SMTP_FROM_EMAIL || 'noreply@closetbyera.com',
    };
}

const transporters = new Map<EmailProviderId, Transporter>();

function getTransporter(id: EmailProviderId): Transporter {
    let transporter = transporters.get(id);
    if (!transporter) {
        transporter = nodemailer.createTransport({
            ...providerOptions(id)!,
            // Fail fast so the next provider still fits in the caller's deadline.
            connectionTimeout: 3000,
            greetingTimeout: 3000,
            socketTimeout: 8000,
        });
        transporters.set(id, transporter);
    }
    return transporter;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
        promise.then(
            value => { clearTimeout(timer); resolve(value); },
            error => { clearTimeout(timer); reject(error); }
        );
    });
}

export async function sendEmail(message: EmailMessage, options: SendOptions = {}): Promise<EmailResult> {
    const providers = getEmailProviders();
    if (!providers.length) {
        logger.warn('No email provider configured; email not sent', { subject: message.subject });
        return { success: false, error: 'No email provider configured' };
    }

    const startedAt = Date.now();
    const sender = getSender();
    const errors: string[] = [];

    for (const provider of providers) {
        const remaining = options.deadlineMs === undefined
            ? undefined
            : options.deadlineMs - (Date.now() - startedAt);
        if (remaining !== undefined && remaining < 500) break;

        try {
            const send = getTransporter(provider).sendMail({
                from: { name: sender.name, address: sender.address },
                to: message.to,
                subject: message.subject,
                html: message.html,
                text: message.text,
            });
            const info = await (remaining === undefined ? send : withTimeout(send, remaining));
            logger.info('Email sent', { provider, messageId: info.messageId });
            return { success: true, provider, messageId: info.messageId };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            errors.push(`${provider}: ${reason}`);
            logger.warn('Email provider failed, trying next', { provider, reason });
        }
    }

    logger.error('All email providers failed', new Error(errors.join('; ')), { subject: message.subject });
    return { success: false, error: errors.join('; ') || 'Deadline exceeded' };
}
