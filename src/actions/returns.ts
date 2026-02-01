'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';

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
    const supabase = await createClient();

    try {
        const limit = options?.limit ?? 20;
        const offset = options?.offset ?? 0;

        // Count query
        let countQuery = (supabase as any)
            .from('returns')
            .select('*', { count: 'exact', head: true });

        if (options?.status && options.status !== 'all') {
            countQuery = countQuery.eq('status', options.status);
        }

        const { count } = await countQuery;

        // Data query
        let query = (supabase as any)
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

        return { success: true, data: { returns: data || [], total: count || 0 } };
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
    const supabase = await createClient();

    try {
        const updateData: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString()
        };

        if (adminNotes) {
            updateData.admin_notes = adminNotes;
        }

        const { error } = await (supabase as any)
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
 * Create a new return request (typically by customer or admin)
 */
export async function createReturn(data: {
    order_id: string;
    customer_id: string;
    reason: string;
    refund_amount?: number;
}): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();

    try {
        const { data: returnData, error } = await (supabase as any)
            .from('returns')
            .insert({
                order_id: data.order_id,
                customer_id: data.customer_id,
                reason: data.reason,
                refund_amount: data.refund_amount || 0,
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
