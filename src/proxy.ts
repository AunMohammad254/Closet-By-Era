import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Security headers to apply to all responses
const securityHeaders: Record<string, string> = {
    'X-DNS-Prefetch-Control': 'on',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    // HSTS - only in production
    ...(process.env.NODE_ENV === 'production'
        ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }
        : {}),
};

function applySecurityHeaders(response: NextResponse): NextResponse {
    for (const [key, value] of Object.entries(securityHeaders)) {
        response.headers.set(key, value);
    }
    return response;
}

/**
 * Validate request origin for mutations (defense in depth on top of
 * Next.js' own Server Action origin check).
 */
function validateOrigin(request: NextRequest): boolean {
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return true;

    const origin = request.headers.get('origin');
    if (!origin) return true; // Same-origin requests may omit Origin

    let originHost: string;
    try {
        originHost = new URL(origin).host;
    } catch {
        return false; // e.g. "Origin: null" from sandboxed frames
    }

    if (process.env.NODE_ENV === 'development' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(originHost)) {
        return true;
    }

    return originHost === request.headers.get('host');
}

function redirectTo(request: NextRequest, pathname: string, params: Record<string, string>) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = '';
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return applySecurityHeaders(NextResponse.redirect(url));
}

export async function proxy(request: NextRequest) {
    if (!validateOrigin(request)) {
        return new NextResponse('Invalid origin', { status: 403 });
    }

    let response = applySecurityHeaders(NextResponse.next({ request }));

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = applySecurityHeaders(NextResponse.next({ request }))
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // getClaims() verifies the JWT signature and refreshes the session.
    // Never use getSession() here: it trusts the cookie without verification.
    const { data } = await supabase.auth.getClaims()
    const claims = data?.claims
    const userId = claims?.sub
    const email = typeof claims?.email === 'string' ? claims.email : undefined

    const { pathname } = request.nextUrl

    const isSuperAdminRoute = pathname.startsWith('/super-admin') &&
        !pathname.startsWith('/super-admin/login')

    const isAdminRoute = (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) &&
        !pathname.startsWith('/admin/login')

    const isProtectedRoute = pathname.startsWith('/account') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/checkout')

    // Redirect to login if accessing protected route without session
    if ((isSuperAdminRoute || isAdminRoute || isProtectedRoute) && !userId) {
        const loginPath = isSuperAdminRoute ? '/super-admin/login' : isAdminRoute ? '/admin/login' : '/auth/login'
        return redirectTo(request, loginPath, { redirectedFrom: pathname })
    }

    if (!userId || (!isAdminRoute && !isSuperAdminRoute)) {
        return response
    }

    // Staff routes: the role comes from customers.role only. user_metadata is
    // editable by the user, so it must never grant access.
    const { data: customer } = await supabase
        .from('customers')
        .select('role')
        .eq('auth_id', userId)
        .maybeSingle()

    const role = customer?.role
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || process.env['Super-Admin-Email']
    const adminEmail = process.env.ADMIN_EMAIL

    if (isSuperAdminRoute) {
        if (role !== 'super_admin' || !superAdminEmail || email !== superAdminEmail) {
            return redirectTo(request, '/', { error: 'unauthorized' })
        }
        return response
    }

    let isAdmin = role === 'admin' || role === 'super_admin'
    // STRICT: when ADMIN_EMAIL is set, only that account (or the super-admin) may enter.
    if (isAdmin && adminEmail && email !== adminEmail && email !== superAdminEmail) {
        isAdmin = false
    }

    if (!isAdmin) {
        return redirectTo(request, '/', { error: 'unauthorized' })
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, service worker and static assets
         * - api/webhooks (server-to-server; each route verifies its own signature)
         */
        '/((?!_next/static|_next/image|api/webhooks/|favicon.ico|sw.js|workbox-.*|swe-worker-.*|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
    ],
}
