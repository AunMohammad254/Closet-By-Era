'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import { UpdateOrderStatusSchema, UpdatePaymentStatusSchema } from '@/lib/validations';
import { sendOrderStatusEmail } from '@/lib/nodemailer';

export async function getRecentOrders(limit = 5) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        logger.error('Error fetching recent orders', error, { action: 'getRecentOrders' });
        return [];
    }

    return data;
}

export async function getOrders(page = 1, pageSize = 10, status?: string) {
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('orders')
        .select('*', { count: 'exact' });

    if (status && status !== 'All') {
        query = query.eq('status', status.toLowerCase() as "pending" | "packed" | "shipping" | "delivered" | "cancelled");
    }

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        logger.error('Error fetching orders', error, { action: 'getOrders', page, status });
        return { data: [], count: 0 };
    }

    return { data, count };
}

export async function getOrderById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        logger.error('Error fetching order', error, { action: 'getOrderById', orderId: id });
        return null;
    }

    return data;
}

export async function updateOrderStatus(id: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
    // Rate limiting (use 'admin' as identifier for now - in production use actual user ID)
    const rateCheck = await checkRateLimit('admin-user', 'updateOrderStatus', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    // Validate input
    const validation = UpdateOrderStatusSchema.safeParse({ id, status: newStatus.toLowerCase() });
    if (!validation.success) {
        logger.warn('Order status validation failed', { action: 'updateOrderStatus', id, errors: validation.error.issues });
        return { success: false, error: 'Invalid order ID or status' };
    }

    const supabase = await createClient();
    // Update the status
    const { data: order, error } = await supabase
        .from('orders')
        .update({ status: validation.data.status as "pending" | "packed" | "shipping" | "delivered" | "cancelled" })
        .eq('id', id)
        .select(`
            *,
            customer:customers(first_name, email)
        `)
        .single();

    if (error) {
        logger.error('Error updating order status', error, { action: 'updateOrderStatus', orderId: id });
        return { success: false, error: 'Failed to update order status' };
    }

    // Send notification email (fire-and-forget)
    if (order?.customer?.email) {
        sendOrderStatusEmail(
            order.customer.email,
            order.customer.first_name || 'Customer',
            order.order_number,
            newStatus
        ).catch(err => logger.error('Failed to send status email', err, { orderId: id }));
    }

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    return { success: true };
}

export async function updatePaymentStatus(id: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
    // Rate limiting
    const rateCheck = await checkRateLimit('admin-user', 'updatePaymentStatus', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    // Validate input
    const validation = UpdatePaymentStatusSchema.safeParse({ id, status: newStatus.toLowerCase() });
    if (!validation.success) {
        logger.warn('Payment status validation failed', { action: 'updatePaymentStatus', id });
        return { success: false, error: 'Invalid order ID or payment status' };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from('orders')
        .update({ payment_status: validation.data.status as "pending" | "paid" | "failed" | "refunded" })
        .eq('id', id);

    if (error) {
        logger.error('Error updating payment status', error, { action: 'updatePaymentStatus', orderId: id });
        return { success: false, error: 'Failed to update payment status' };
    }

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    return { success: true };
}
