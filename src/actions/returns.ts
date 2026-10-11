'use server';

import { getAdminContext, getSessionUser, FORBIDDEN } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';
import type { TablesUpdate } from '@/types/supabase';

// Types
interface Return {
    id: string;
    order_id: string;
    customer_id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'refunded';
    refund_amount: number;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Get all returns with optional status filter
 */
export async function getReturns(options?: {
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<ActionResult<{ returns: Return[]; total: number }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;

    try {
        const limit = options?.limit ?? 20;
        const offset = options?.offset ?? 0;

        // Count query
        let countQuery = supabase
            .from('returns')
            .select('*', { count: 'exact', head: true });

        if (options?.status && options.status !== 'all') {
            countQuery = countQuery.eq('status', options.status);
        }

        const { count } = await countQuery;

        // Data query
        let query = supabase
            .from('returns')
            .select(`
                *,
                order:orders(order_number, total_amount),
                customer:customers(first_name, last_name, email)
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (options?.status && options.status !== 'all') {
            query = query.eq('status', options.status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching returns:', error);
            return { success: false, error: 'Failed to fetch returns' };
        }

        return { success: true, data: { returns: (data ?? []) as unknown as Return[], total: count || 0 } };
    } catch (error) {
        console.error('Error in getReturns:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Update return status
 */
export async function updateReturnStatus(
    returnId: string,
    status: 'approved' | 'rejected' | 'refunded',
    adminNotes?: string
): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;

    try {
        const updateData: TablesUpdate<'returns'> = {
            status,
            updated_at: new Date().toISOString(),
            ...(adminNotes ? { admin_notes: adminNotes } : {}),
        };

        const { error } = await supabase
            .from('returns')
            .update(updateData)
            .eq('id', returnId);

        if (error) {
            console.error('Error updating return:', error);
            return { success: false, error: 'Failed to update return' };
        }

        revalidatePath('/admin/returns');
        return { success: true };
    } catch (error) {
        console.error('Error in updateReturnStatus:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Create a return request for one of the signed-in customer's own orders.
 * The refund amount is decided by an admin, never by the requester.
 */
export async function createReturn(data: {
    order_id: string;
    reason: string;
}): Promise<ActionResult<{ id: string }>> {
    const session = await getSessionUser();
    if (!session) return { success: false, error: 'Please sign in to request a return' };

    const reason = data.reason?.trim();
    if (!reason || reason.length > 1000) return { success: false, error: 'Please describe the reason (max 1000 characters)' };

    try {
        const { supabase, user } = session;
        const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('auth_id', user.id)
            .maybeSingle();
        if (!customer) return { success: false, error: 'Customer profile not found' };

        const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('id', data.order_id)
            .eq('customer_id', customer.id)
            .maybeSingle();
        if (!order) return { success: false, error: 'Order not found' };

        const { data: returnData, error } = await supabase
            .from('returns')
            .insert({
                order_id: order.id,
                customer_id: customer.id,
                reason,
                refund_amount: 0,
                status: 'pending'
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating return:', error);
            return { success: false, error: 'Failed to create return' };
        }

        revalidatePath('/admin/returns');
        return { success: true, data: { id: returnData.id } };
    } catch (error) {
        console.error('Error in createReturn:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}
