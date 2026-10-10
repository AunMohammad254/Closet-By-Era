'use server';

import { getAdminContext, FORBIDDEN } from '@/lib/auth';
import { ActionResult } from '@/types/shared';
import type { Database } from '@/types/supabase';

type Customer = Database['public']['Tables']['customers']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export type CustomerDetails = Customer & {
    orders: (Order & { items: OrderItem[] })[];
    stats: { totalSpent: number; totalOrders: number };
};

/** Strip characters that have meaning inside a PostgREST or() filter. */
function sanitizeSearch(term: string): string {
    return term.replace(/[,()*%\\]/g, ' ').trim().slice(0, 100);
}

export async function getAdminCustomers(options?: {
    offset?: number;
    limit?: number;
    search?: string;
}): Promise<ActionResult<{ customers: Customer[]; total: number }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;

    try {
        const offset = options?.offset ?? 0;
        const limit = Math.min(options?.limit ?? 20, 100);

        // One round trip; the count respects the search filter.
        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const term = options?.search ? sanitizeSearch(options.search) : '';
        if (term) {
            query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`);
        }

        const { data, error, count } = await query;

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

export async function getCustomerDetails(customerId: string): Promise<ActionResult<CustomerDetails>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;

    try {
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

    } catch (error) {
        console.error('Error fetching customer details:', error);
        return { success: false, error: (error as Error).message };
    }
}
