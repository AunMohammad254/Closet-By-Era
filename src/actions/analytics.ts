'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { toCsvCell } from '@/lib/order-display';
import { Json } from '@/types/supabase';

interface AnalyticsSummary {
    timeline: { date: string; views: number }[];
    topProducts: { product_id: string; name: string; views: number }[];
    totalViews: number;
}

interface DashboardStats {
    totalRevenue: number;
    activeOrders: number;
    totalProducts: number;
    totalCustomers: number;
}

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
        logger.error('Failed to track event', error as Error, { action: 'trackEvent', eventType });
        // We don't want to crash the client if tracking fails
    }
}

export async function getAnalyticsSummary(daysBack: number = 7): Promise<AnalyticsSummary> {
    const ctx = await getAdminContext();
    if (!ctx) return { timeline: [], topProducts: [], totalViews: 0 };
    // Optimized: Use RPC function for database-side aggregation
    // RPC is SECURITY DEFINER and revoked from API roles; call it as the service role after the admin check.
    const { data, error } = await createAdminClient().rpc('get_analytics_summary', {
        days_back: daysBack
    });

    if (error) {
        logger.error('Failed to fetch analytics summary', error, { action: 'getAnalyticsSummary', daysBack });
        return {
            timeline: [],
            topProducts: [],
            totalViews: 0
        };
    }

    // The RPC returns a properly typed result
    const summary = data as unknown as AnalyticsSummary;
    return {
        timeline: summary?.timeline || [],
        topProducts: summary?.topProducts || [],
        totalViews: summary?.totalViews || 0
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const ctx = await getAdminContext();
    if (!ctx) return { totalRevenue: 0, activeOrders: 0, totalProducts: 0, totalCustomers: 0 };
    // Optimization: Use SQL RPC to calculate stats on the database side
    // This avoids fetching all orders to the server-side logic
    const { data, error } = await createAdminClient().rpc('get_admin_stats');

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

    // RPC returns a typed object
    const stats = data as unknown as DashboardStats;

    return {
        totalRevenue: Number(stats?.totalRevenue) || 0,
        activeOrders: Number(stats?.activeOrders) || 0,
        totalProducts: Number(stats?.totalProducts) || 0,
        totalCustomers: Number(stats?.totalCustomers) || 0
    };
}

// Enhanced Analytics: Sales by Category
export interface CategorySale {
    category_id: string;
    category_name: string;
    total_sales: number;
    order_count: number;
    product_count: number;
}

export async function getSalesByCategory(daysBack: number = 30): Promise<CategorySale[]> {
    const ctx = await getAdminContext();
    if (!ctx) return [];
    const { supabase } = ctx;

    // Get orders within date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            total,
            created_at,
            order_items!inner(
                product_id,
                quantity,
                price_at_purchase,
                products!inner(
                    id,
                    category_id,
                    categories!inner(id, name)
                )
            )
        `)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'delivered');

    if (error || !orders) {
        logger.error('Failed to get sales by category', error);
        return [];
    }

    // Aggregate by category
    const categoryMap = new Map<string, CategorySale>();
    const productsByCategory = new Map<string, Set<string>>();
    const ordersByCategory = new Map<string, Set<string>>();

    for (const order of orders) {
        const items = order.order_items || [];
        for (const item of items) {
            const product = item.products;
            const category = product?.categories;
            if (!category) continue;

            const key = category.id;
            if (!categoryMap.has(key)) {
                categoryMap.set(key, {
                    category_id: category.id,
                    category_name: category.name || 'Uncategorized',
                    total_sales: 0,
                    order_count: 0,
                    product_count: 0
                });
                productsByCategory.set(key, new Set());
                ordersByCategory.set(key, new Set());
            }

            const catSale = categoryMap.get(key)!;
            catSale.total_sales += Number(item.price_at_purchase) * Number(item.quantity);
            productsByCategory.get(key)!.add(product.id);
            ordersByCategory.get(key)!.add(order.id);
        }
    }

    // Add product counts
    for (const [key, catSale] of categoryMap) {
        catSale.product_count = productsByCategory.get(key)!.size;
        catSale.order_count = ordersByCategory.get(key)!.size;
    }

    return Array.from(categoryMap.values()).sort((a, b) => b.total_sales - a.total_sales);
}

// Revenue trend for report
export interface RevenueTrend {
    date: string;
    revenue: number;
    order_count: number;
}

export async function getRevenueTrend(daysBack: number = 30): Promise<RevenueTrend[]> {
    const ctx = await getAdminContext();
    if (!ctx) return [];
    const { supabase } = ctx;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

    if (error || !orders) {
        logger.error('Failed to get revenue trend', error);
        return [];
    }

    // Group by date
    const dailyMap = new Map<string, RevenueTrend>();
    for (const order of orders) {
        const date = new Date(order.created_at!).toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
            dailyMap.set(date, { date, revenue: 0, order_count: 0 });
        }
        const day = dailyMap.get(date)!;
        day.revenue += Number(order.total) || 0;
        day.order_count += 1;
    }

    return Array.from(dailyMap.values());
}

// Generate CSV export data
export async function getOrdersExportData(daysBack: number = 30): Promise<string> {
    const ctx = await getAdminContext();
    if (!ctx) return '';
    const { supabase } = ctx;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            total,
            created_at,
            customer:customer_id(first_name, last_name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

    if (error || !orders) {
        return 'Error fetching orders';
    }

    // CSV header
    const rows: string[] = ['Order ID,Customer,Email,Status,Total,Date'];

    for (const order of orders) {
        const customer = order.customer;
        const customerName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Guest';
        const email = customer?.email || 'N/A';
        const date = new Date(order.created_at!).toLocaleDateString('en-PK');

        rows.push([order.id, customerName, email, order.status, order.total, date].map(toCsvCell).join(','));
    }

    return rows.join('\n');
}
