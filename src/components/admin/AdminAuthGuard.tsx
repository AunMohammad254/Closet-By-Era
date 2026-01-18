'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

interface CustomerData {
    role: string;
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
        const checkAuth = async () => {
            try {
                const supabase = createClient();

                // Get current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    throw new Error('Failed to get session');
                }

                if (!session) {
                    // Not logged in, redirect to login
                    router.replace('/auth/login?redirectedFrom=/admin');
                    return;
                }

                // Check if user has admin role in customers table
                const { data: customer, error: customerError } = await supabase
                    .from('customers')
                    .select('role')
                    .eq('auth_id', session.user.id)
                    .single();

                if (customerError) {
                    console.error('Customer fetch error:', customerError);

                    // If customer doesn't exist, they might need to be created
                    if (customerError.code === 'PGRST116') {
                        // No customer record - create one
                        const { error: insertError } = await supabase
                            .from('customers')
                            .insert({
                                auth_id: session.user.id,
                                email: session.user.email || '',
                                first_name: session.user.user_metadata?.first_name || null,
                                last_name: session.user.user_metadata?.last_name || null,
                                role: 'customer' // Default to customer, admin must be set manually
                            });

                        if (insertError) {
                            console.error('Failed to create customer:', insertError);
                        }

                        // Not an admin
                        setError('You do not have admin privileges.');
                        setTimeout(() => router.replace('/'), 2000);
                        return;
                    }

                    throw new Error('Failed to verify admin status');
                }

                const typedCustomer = customer as CustomerData;

                if (typedCustomer?.role !== 'admin') {
                    setError('You do not have admin privileges.');
                    setTimeout(() => router.replace('/'), 2000);
                    return;
                }

                // User is authorized admin
                setIsAuthorized(true);
            } catch (err) {
                console.error('Auth check failed:', err);
                setError('Authentication error. Please try logging in again.');
                setTimeout(() => router.replace('/auth/login'), 2000);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
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
