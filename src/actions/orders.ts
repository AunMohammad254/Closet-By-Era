'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Order, OrderWithItems, OrderStatus, ActionResponse } from '@/types/database';

// ============================================================================
// Get all orders
// ============================================================================

export async function getOrders(): Promise<ActionResponse<Order[]>> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data as Order[] };
    } catch (err) {
        return { success: false, error: 'Failed to fetch orders' };
    }
}

// ============================================================================
// Get single order with items
// ============================================================================

export async function getOrderById(id: string): Promise<ActionResponse<OrderWithItems>> {
    try {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (orderError) {
            return { success: false, error: orderError.message };
        }

        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
        *,
        product:products (*)
      `)
            .eq('order_id', id);

        if (itemsError) {
            return { success: false, error: itemsError.message };
        }

        return {
            success: true,
            data: {
                ...order,
                order_items: items || [],
            } as OrderWithItems,
        };
    } catch (err) {
        return { success: false, error: 'Failed to fetch order' };
    }
}

// ============================================================================
// Update order status
// ============================================================================

export async function updateOrderStatus(
    id: string,
    status: OrderStatus
): Promise<ActionResponse<void>> {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/orders');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: 'Failed to update order status' };
    }
}

// ============================================================================
// Update payment status
// ============================================================================

export async function updatePaymentStatus(
    id: string,
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
): Promise<ActionResponse<void>> {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ payment_status: paymentStatus })
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/orders');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: 'Failed to update payment status' };
    }
}

// ============================================================================
// Get order statistics
// ============================================================================

export async function getOrderStats(): Promise<ActionResponse<{
    total: number;
    pending: number;
    delivered: number;
    revenue: number;
}>> {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('status, total_amount, payment_status');

        if (error) {
            return { success: false, error: error.message };
        }

        const stats = {
            total: orders?.length || 0,
            pending: orders?.filter(o => o.status === 'pending').length || 0,
            delivered: orders?.filter(o => o.status === 'delivered').length || 0,
            revenue: orders
                ?.filter(o => o.payment_status === 'paid')
                .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
        };

        return { success: true, data: stats };
    } catch (err) {
        return { success: false, error: 'Failed to fetch order stats' };
    }
}
