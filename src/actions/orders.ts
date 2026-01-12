'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getRecentOrders(limit = 5) {
    const { data, error } = await supabaseServer
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent orders:', error);
        return [];
    }

    return data;
}

export async function getOrders(page = 1, pageSize = 10, status?: string) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseServer
        .from('orders')
        .select('*', { count: 'exact' });

    if (status && status !== 'All') {
        query = query.eq('status', status.toLowerCase());
    }

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching orders:', error);
        return { data: [], count: 0 };
    }

    return { data, count };
}

export async function getOrderById(id: string) {
    const { data, error } = await supabaseServer
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }

    return data;
}

import { generateStatusEmailHtml, sendEmail } from '@/lib/email';

export async function updateOrderStatus(id: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
    // 1. Update the status
    const { data: order, error } = await supabaseServer
        .from('orders')
        .update({ status: newStatus.toLowerCase() })
        .eq('id', id)
        .select(`
            *,
            customer:customers(first_name, email)
        `)
        .single();

    if (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: 'Failed to update order status' };
    }

    // 2. Send Notification Email
    // We do this asynchronously/independently so we don't block the UI if it fails
    // In a real production app, this might go to a queue.
    if (order && order.customer && order.customer.email) {
        try {
            const html = generateStatusEmailHtml(
                order.customer.first_name || 'Customer',
                order.order_number,
                newStatus
            );

            // Fire and forget (or await if critical)
            // Note: Since this is server-side, we might not have the same supabase client with 'functions' invoke capability if using supabase-ssr client in certain ways,
            // but the client-side/generic supabase client typically works. 
            // However, 'src/lib/email' uses the client-side 'supabase' export which might need anon key.
            // Let's verify imports in email.ts. It uses '@/lib/supabase'.

            await sendEmail(
                order.customer.email,
                `Order Update - ${order.order_number}`,
                html
            );
        } catch (emailErr) {
            console.error('Failed to send status update email:', emailErr);
        }
    }

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath('/admin');
    return { success: true };
}

export async function updatePaymentStatus(id: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseServer
        .from('orders')
        .update({ payment_status: newStatus.toLowerCase() })
        .eq('id', id);

    if (error) {
        console.error('Error updating payment status:', error);
        return { success: false, error: 'Failed to update payment status' };
    }

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    return { success: true };
}

