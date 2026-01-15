import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Security headers to apply to all responses
const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    // HSTS - only in production
    ...(process.env.NODE_ENV === 'production' && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    })
};

/**
 * Validate request origin for server actions (CSRF-like protection)
 */
function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // Skip validation for GET requests and non-action requests
    if (request.method === 'GET') return true;

    // In development, allow localhost
    if (process.env.NODE_ENV === 'development') {
        if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
            return true;
        }
    }

    // Validate origin matches host
    if (origin && host) {
        const originHost = new URL(origin).host;
        return originHost === host;
    }

    return true; // Allow if origin header missing (same-origin requests)
}

export async function middleware(request: NextRequest) {
    // Validate origin for mutations
    if (!validateOrigin(request)) {
        return new NextResponse('Invalid origin', { status: 403 });
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
        if (value) response.headers.set(key, value);
    });

    // Create an authenticated Supabase client
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
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    // Re-apply security headers after response recreation
                    Object.entries(securityHeaders).forEach(([key, value]) => {
                        if (value) response.headers.set(key, value);
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Get the session
    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Define protected routes
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/dashboard')

    const isProtectedRoute = request.nextUrl.pathname.startsWith('/account') ||
        request.nextUrl.pathname.startsWith('/profile') ||
        request.nextUrl.pathname.startsWith('/checkout')

    // Redirect to login if accessing protected route without session
    if ((isAdminRoute || isProtectedRoute) && !session) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // If trying to access admin route, check for admin role
    if (isAdminRoute && session) {
        // Optimization: Check metadata first (0ms latency)
        const metadataRole = session.user.app_metadata?.role || session.user.user_metadata?.role

        let isAdmin = false

        if (metadataRole !== undefined) {
            isAdmin = metadataRole === 'admin'
        } else {
            // Fallback: Fetch customer role from database (Slower, handles legacy sessions)
            const { data: customer } = await supabase
                .from('customers')
                .select('role')
                .eq('auth_id', session.user.id)
                .single()

            isAdmin = customer?.role === 'admin'
        }

        if (!isAdmin) {
            // User is not an admin, redirect to home with error
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/'
            redirectUrl.searchParams.set('error', 'unauthorized')
            return NextResponse.redirect(redirectUrl)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
