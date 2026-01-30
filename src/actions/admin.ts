'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/types/shared';
import type { Database } from '@/types/supabase';

type Customer = Database['public']['Tables']['customers']['Row'];

/**
 * Verifies the current user has admin role.
 * Returns the customer record if admin, null otherwise.
 */
async function verifyAdminRole(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Customer | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', user.id)
        .single();

    if (!customer || customer.role !== 'admin') {
        return null;
    }

    return customer;
}

export async function getAdminCustomers(): Promise<ActionResult<Customer[]>> {
    const supabase = await createClient();

    try {
        const admin = await verifyAdminRole(supabase);

        if (!admin) {
            console.error('getAdminCustomers: Unauthorized - user is not admin');
            return { success: false, error: 'Forbidden: Admin access required' };
        }

        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching customers:', error);
            throw new Error(error.message);
        }

        return { success: true, data };
    } catch (error: unknown) {
        console.error('Server action error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return { success: false, error: message };
    }
}
