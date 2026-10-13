import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VERIFY_TYPES, type VerifyType } from '@/lib/email/auth';
import { isSameSitePath } from '@/lib/safe-path';
import { getSiteUrl } from '@/lib/site-url';

/**
 * Where to send the visitor next. Under `next start -H 0.0.0.0` (containers,
 * the e2e server) a route handler's request.nextUrl reports that bind address,
 * which browsers on Windows refuse to open; use the site's own URL then.
 */
function redirectOrigin(request: NextRequest): string {
    const { hostname, origin } = request.nextUrl;
    return hostname === '0.0.0.0' || hostname === '[::]' ? getSiteUrl() : origin;
}

/**
 * Landing page for links in auth emails (built in src/lib/email/auth.ts).
 * Verifies the token on the server and sets the session cookie, so the link
 * works on any device, then continues to `next`.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const origin = redirectOrigin(request);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const nextParam = searchParams.get('next') ?? '/';
    // Same-site paths only (no "//evil.com", "/\evil.com" or absolute URLs).
    const next = isSameSitePath(nextParam) ? nextParam : '/';

    if (tokenHash && type && (VERIFY_TYPES as readonly string[]).includes(type)) {
        const supabase = await createClient();
        const { error } = await supabase.auth.verifyOtp({ type: type as VerifyType, token_hash: tokenHash });
        if (!error) {
            return NextResponse.redirect(new URL(next, origin));
        }
    }

    const failed = new URL('/auth/login', origin);
    failed.searchParams.set('error', 'link_expired');
    return NextResponse.redirect(failed);
}
