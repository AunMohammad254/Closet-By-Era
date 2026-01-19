'use server';

import { createClient } from '@/lib/supabase/server';
import { Json } from '@/types/supabase';

export async function trackEvent(eventType: string, data: { pagePath?: string, productId?: string, meta?: Json }) {
    try {
        const supabase = await createClient();
        await supabase.from('analytics_events').insert({
            event_type: eventType,
            page_path: data.pagePath,
            product_id: data.productId,
            meta: data.meta
        });
    } catch (error) {
        console.error('Failed to track event:', error);
        // We don't want to crash the client if tracking fails
    }
}

export async function getAnalyticsSummary(daysBack: number = 7) {
    const supabase = await createClient();
    // Optimized: Use RPC function for database-side aggregation
    const { data, error } = await supabase.rpc('get_analytics_summary', {
        days_back: daysBack
    });

    if (error) {
        console.error('Failed to fetch analytics summary:', error);
        return {
            timeline: [],
            topProducts: [],
            totalViews: 0
        };
    }

    const summary = data as Record<string, any>;
    return {
        timeline: summary?.timeline || [],
        topProducts: summary?.topProducts || [],
        totalViews: summary?.totalViews || 0
    };
}

export async function getDashboardStats() {
    const supabase = await createClient();
    // Optimization: Use SQL RPC to calculate stats on the database side
    // This avoids fetching all orders to the server-side logic
    const { data, error } = await supabase.rpc('get_admin_stats');

    if (error) {
        // console.error('Failed to fetch admin stats via RPC:', error);
        // Fallback to zeros (silent fail preferred in production unless debugging)
        return {
            totalRevenue: 0,
            activeOrders: 0,
            totalProducts: 0,
            totalCustomers: 0
        };
    }

    // RPC returns a JSON object (or single row)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = data as any;

    return {
        totalRevenue: Number(stats?.totalRevenue) || 0,
        activeOrders: Number(stats?.activeOrders) || 0,
        totalProducts: Number(stats?.totalProducts) || 0,
        totalCustomers: Number(stats?.totalCustomers) || 0
    };
}
