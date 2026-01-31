'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface CustomerData {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
}

interface AdminUser {
    user: User;
    session: Session;
    customer: CustomerData;
    isAdmin: boolean;
}

interface UseAdminAuthReturn {
    adminUser: AdminUser | null;
    isLoading: boolean;
    error: string | null;
    refreshAuth: () => Promise<void>;
}

/**
 * Hook for accessing admin user data
 * Use this in admin components to get current user info
 */
export function useAdminAuth(): UseAdminAuthReturn {
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAdminUser = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                setAdminUser(null);
                return;
            }

            const { data: customer, error: customerError } = await supabase
                .from('customers')
                .select('id, email, first_name, last_name, role')
                .eq('auth_id', session.user.id)
                .single();

            if (customerError || !customer) {
                setError('Could not load user data');
                setAdminUser(null);
                return;
            }

            setAdminUser({
                user: session.user,
                session,
                customer: customer as CustomerData,
                isAdmin: customer.role === 'admin'
            });
        } catch (err) {
            // Silently ignore AbortError - happens during navigation
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            console.error('Failed to fetch admin user:', err);
            setError('Failed to load user data');
            setAdminUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminUser();

        // Listen for auth changes
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setAdminUser(null);
            } else {
                fetchAdminUser();
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchAdminUser]);

    return {
        adminUser,
        isLoading,
        error,
        refreshAuth: fetchAdminUser
    };
}
