'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

/**
 * Client-side auth guard for admin pages
 * Provides double-check after middleware and syncs customer data
 */
export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        let verifiedUserId: string | null = null;
        const supabase = createClient();

        const verifyUser = async (sessionUser: { id: string; email?: string } | null) => {
            if (!sessionUser) {
                if (isMounted) {
                    setIsLoading(false);
                    router.replace('/admin/login');
                }
                return;
            }

            // The initial check, INITIAL_SESSION and every token refresh report the
            // same user: look the role up once per signed-in user, not per event.
            if (verifiedUserId === sessionUser.id) return;
            verifiedUserId = sessionUser.id;

            try {
                // Check if user has admin or super_admin role in customers table
                const { data: customer, error: customerError } = await supabase
                    .from('customers')
                    .select('role')
                    .eq('auth_id', sessionUser.id)
                    .maybeSingle();

                if (customerError) {
                    console.error('Customer fetch error:', customerError);
                    throw new Error('Failed to verify admin status');
                }

                const role = customer?.role;
                const isStaff = role === 'admin' || role === 'super_admin';

                if (!isStaff) {
                    if (isMounted) {
                        setError('You do not have admin privileges.');
                        setIsLoading(false);
                        setTimeout(() => router.replace('/'), 2000);
                    }
                    return;
                }

                if (isMounted) {
                    setIsAuthorized(true);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                if (isMounted) {
                    setError('Authentication error. Please try logging in again.');
                    setIsLoading(false);
                    setTimeout(() => router.replace('/admin/login'), 2000);
                }
            }
        };

        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await verifyUser(session.user);
                } else {
                    // Try getUser in case session cookie was just set via server action
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await verifyUser(user);
                    } else if (isMounted) {
                        setIsLoading(false);
                        router.replace('/admin/login');
                    }
                }
            } catch (err) {
                console.error('Session check failed:', err);
                if (isMounted) {
                    setIsLoading(false);
                    router.replace('/admin/login');
                }
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                verifyUser(session.user);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [router]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-600 mx-auto mb-4" />
                    <p className="text-gray-600">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">Redirecting...</p>
                </div>
            </div>
        );
    }

    // Authorized - render children
    if (isAuthorized) {
        return <>{children}</>;
    }

    // Fallback (should not reach here)
    return null;
}
