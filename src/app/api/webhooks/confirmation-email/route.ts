import { NextResponse, type NextRequest } from 'next/server';
import { verifyStandardWebhook } from '@/lib/webhook-signature';
import { AuthEmailHookSchema, buildAuthEmails } from '@/lib/email/auth';
import { sendEmail } from '@/lib/email/transport';
import { logger } from '@/lib/logger';

/**
 * Supabase Auth "Send Email" hook: every auth email (sign-up confirmation,
 * password reset, magic link, email change, security notices) is rendered
 * with our layout and sent through our providers (src/lib/email/transport.ts).
 *
 * Dashboard: Authentication > Hooks > Send Email > HTTPS, URL
 * https://<site>/api/webhooks/confirmation-email; put the generated secret in
 * SEND_EMAIL_HOOK_SECRET. Only requests signed with that secret are accepted.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Supabase allows 5s for the whole hook call, retries included.
const SEND_DEADLINE_MS = 4000;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const hookError = (status: number, message: string) => json({ error: { http_code: status, message } }, status);

export async function POST(request: NextRequest) {
    const secret = process.env.SEND_EMAIL_HOOK_SECRET;
    if (!secret) {
        logger.error('SEND_EMAIL_HOOK_SECRET is not set; auth email not sent', new Error('Missing hook secret'));
        return hookError(500, 'Email hook is not configured');
    }

    const body = await request.text();
    const verified = verifyStandardWebhook(body, {
        id: request.headers.get('webhook-id'),
        timestamp: request.headers.get('webhook-timestamp'),
        signature: request.headers.get('webhook-signature'),
    }, secret);
    if (!verified) return hookError(401, 'Invalid signature');

    let payload;
    try {
        payload = AuthEmailHookSchema.parse(JSON.parse(body));
    } catch {
        return hookError(400, 'Invalid payload');
    }

    const messages = buildAuthEmails(payload);
    const results = await Promise.all(messages.map(m => sendEmail(m, { deadlineMs: SEND_DEADLINE_MS })));
    const failed = results.filter(r => !r.success);

    if (failed.length) {
        logger.error('Auth email failed', new Error(failed.map(f => f.error).join('; ')), {
            type: payload.email_data.email_action_type,
        });
        return hookError(500, 'Could not send the email. Please try again.');
    }

    return json({});
}
