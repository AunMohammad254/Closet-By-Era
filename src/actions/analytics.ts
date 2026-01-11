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

export async function getAnalyticsSummary() {
    // 1. Get total views (last 30 days)
    // 2. Get top 5 viewed products
    // 3. Get generic timeline data (views per day)

    // Note: Complex aggregation is better done via RPC or raw SQL, 
    // but for simplicity/universality we'll fetch and aggregate small datasets or use simplified queries.
    // For production scaling, move this to a Supabase Database Function (RPC).

    // Fetch Last 7 Days Views
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentEvents } = await supabaseServer
        .from('analytics_events')
        .select('created_at, event_type')
        .eq('event_type', 'view_product')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

    // Aggregate Views Per Day
    const viewsPerDay: Record<string, number> = {};
    recentEvents?.forEach(e => {
        const date = new Date(e.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        viewsPerDay[date] = (viewsPerDay[date] || 0) + 1;
    });

    const timelineData = Object.entries(viewsPerDay).map(([name, views]) => ({ name, views }));

    // Fetch Top Products
    // Using a "primitive" group by approach since JS SDK doesn't support complex groupBy easily without RPC
    // We will just fetch the last 100 'view_product' events and see who wins (Sampled approach for MVP)
    const { data: topEvents } = await supabaseServer
        .from('analytics_events')
        .select('product_id, created_at')
        .eq('event_type', 'view_product')
        .limit(200);

    const productCounts: Record<string, number> = {};
    topEvents?.forEach(e => {
        if (e.product_id) {
            productCounts[e.product_id] = (productCounts[e.product_id] || 0) + 1;
        }
    });

    // Sort and get top IDs
    const topProductIds = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

    // Fetch Product Names for these IDs
    let topProducts: { name: string; views: number }[] = [];
    if (topProductIds.length > 0) {
        const { data: products } = await supabaseServer
            .from('products')
            .select('id, name')
            .in('id', topProductIds);

        topProducts = topProductIds.map(id => {
            const p = products?.find(prod => prod.id === id);
            return {
                name: p?.name || 'Unknown Product',
                views: productCounts[id]
            };
        });
    }

    return {
        timeline: timelineData,
        topProducts: topProducts
    };
}
