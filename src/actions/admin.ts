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

export async function getAdminCustomers(options?: {
    offset?: number;
    limit?: number;
    search?: string;
}): Promise<ActionResult<{ customers: Customer[]; total: number }>> {
    const supabase = await createClient();

    try {
        const admin = await verifyAdminRole(supabase);

        if (!admin) {
            console.error('getAdminCustomers: Unauthorized - user is not admin');
            return { success: false, error: 'Forbidden: Admin access required' };
        }

        const offset = options?.offset ?? 0;
        const limit = options?.limit ?? 20;

        // Get total count
        const { count } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });

        // Build query with pagination
        let query = supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply search filter if provided
        if (options?.search) {
            query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error fetching customers:', error);
            throw new Error(error.message);
        }

        return { success: true, data: { customers: data || [], total: count || 0 } };
    } catch (error: unknown) {
        console.error('Server action error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return { success: false, error: message };
    }
}

export async function getCustomerDetails(customerId: string): Promise<ActionResult<any>> {
    const supabase = await createClient();

    try {
        const admin = await verifyAdminRole(supabase);
        if (!admin) {
            return { success: false, error: 'Forbidden: Admin access required' };
        }

        // Fetch customer profile
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

        if (customerError) throw customerError;

        // Fetch orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Calculate totals
        const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        const totalOrders = orders?.length || 0;

        return {
            success: true,
            data: {
                ...customer,
                orders: orders || [],
                stats: {
                    totalSpent,
                    totalOrders
                }
            }
        };

    } catch (error: any) {
        console.error('Error fetching customer details:', error);
        return { success: false, error: error.message };
    }
}
