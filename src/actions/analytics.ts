'use server';

import { supabaseServer } from '@/lib/supabase-server';

export async function trackEvent(eventType: string, data: { pagePath?: string, productId?: string, meta?: any }) {
    try {
        await supabaseServer.from('analytics_events').insert({
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
    // Optimized: Use RPC function for database-side aggregation
    const { data, error } = await supabaseServer.rpc('get_analytics_summary', {
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

    return {
        timeline: data?.timeline || [],
        topProducts: data?.topProducts || [],
        totalViews: data?.totalViews || 0
    };
}

export async function getDashboardStats() {
    // Optimization: Use SQL RPC to calculate stats on the database side
    // This avoids fetching all orders to the server-side logic
    const { data, error } = await supabaseServer.rpc('get_admin_stats');

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
    // The RPC we defined returns json_build_object. 
    // Supabase .rpc() with no parameters returns 'data' as the JSON directly if it's a scalar/json return?
    // Let's verify return structure. If it returns 'json', data is the object.

    return {
        totalRevenue: Number(data.totalRevenue) || 0,
        activeOrders: Number(data.activeOrders) || 0,
        totalProducts: Number(data.totalProducts) || 0,
        totalCustomers: Number(data.totalCustomers) || 0
    };
}
