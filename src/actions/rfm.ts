'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/types/shared';

/**
 * RFM Segment types
 */
export type RFMSegment =
    | 'champions'        // High R, F, M - Best customers
    | 'loyal'            // High F, M - Frequent buyers
    | 'potential'        // Medium R, F, M - Have potential
    | 'new'              // High R, Low F - Recent first purchase
    | 'at_risk'          // Low R, High F - Used to buy frequently
    | 'hibernating'      // Low R, Low F - Haven't bought in a while
    | 'lost';            // Very Low R - Might be lost

export interface CustomerRFM {
    customer_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    recency_days: number;      // Days since last order
    frequency: number;         // Total orders
    monetary: number;          // Total spend
    r_score: number;           // 1-5 score
    f_score: number;           // 1-5 score
    m_score: number;           // 1-5 score
    segment: RFMSegment;
    last_order_date: string | null;
}

interface SegmentStats {
    segment: RFMSegment;
    count: number;
    avg_monetary: number;
    avg_frequency: number;
}

/**
 * Calculate RFM scores and segments for all customers
 */
export async function getCustomerRFMAnalysis(): Promise<ActionResult<{
    customers: CustomerRFM[];
    segments: SegmentStats[];
}>> {
    const supabase = await createClient();

    try {
        // Verify admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('customers')
            .select('role')
            .eq('auth_id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return { success: false, error: 'Admin access required' };
        }

        // Get all customers with their order stats
        const { data: customers, error: custError } = await supabase
            .from('customers')
            .select('id, email, first_name, last_name');

        if (custError) throw custError;

        // Get order stats per customer
        const { data: orderStats, error: orderError } = await supabase
            .from('orders')
            .select('customer_id, total, created_at')
            .eq('payment_status', 'paid');

        if (orderError) throw orderError;

        // Calculate RFM for each customer
        const now = new Date();
        const customerMap = new Map<string, {
            orders: { total: number; created_at: string }[];
        }>();

        (orderStats || []).forEach(order => {
            if (!order.customer_id) return;
            if (!customerMap.has(order.customer_id)) {
                customerMap.set(order.customer_id, { orders: [] });
            }
            customerMap.get(order.customer_id)!.orders.push({
                total: order.total ?? 0,
                created_at: order.created_at ?? new Date().toISOString()
            });
        });

        // Calculate metrics
        const rfmData: CustomerRFM[] = (customers || []).map(customer => {
            const stats = customerMap.get(customer.id);
            const orders = stats?.orders || [];

            // Calculate RFM metrics
            const lastOrder = orders.length > 0
                ? orders.reduce((latest, o) =>
                    new Date(o.created_at) > new Date(latest.created_at) ? o : latest
                )
                : null;

            const recencyDays = lastOrder
                ? Math.floor((now.getTime() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24))
                : 999;

            const frequency = orders.length;
            const monetary = orders.reduce((sum, o) => sum + o.total, 0);

            return {
                customer_id: customer.id,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
                recency_days: recencyDays,
                frequency,
                monetary,
                r_score: 0,
                f_score: 0,
                m_score: 0,
                segment: 'new' as RFMSegment,
                last_order_date: lastOrder?.created_at || null
            };
        }).filter(c => c.frequency > 0); // Only include customers with orders

        // Calculate percentiles for scoring
        const recencyValues = rfmData.map(c => c.recency_days).sort((a, b) => a - b);
        const frequencyValues = rfmData.map(c => c.frequency).sort((a, b) => a - b);
        const monetaryValues = rfmData.map(c => c.monetary).sort((a, b) => a - b);

        const getScore = (value: number, values: number[], inverse = false) => {
            if (values.length === 0) return 3;
            const percentile = values.indexOf(value) / values.length;
            const score = Math.ceil(percentile * 5) || 1;
            return inverse ? 6 - score : score; // For recency, lower is better
        };

        // Assign scores and segments
        rfmData.forEach(customer => {
            customer.r_score = getScore(customer.recency_days, recencyValues, true);
            customer.f_score = getScore(customer.frequency, frequencyValues);
            customer.m_score = getScore(customer.monetary, monetaryValues);
            customer.segment = calculateSegment(customer.r_score, customer.f_score, customer.m_score);
        });

        // Calculate segment statistics
        const segmentGroups = new Map<RFMSegment, CustomerRFM[]>();
        rfmData.forEach(c => {
            if (!segmentGroups.has(c.segment)) {
                segmentGroups.set(c.segment, []);
            }
            segmentGroups.get(c.segment)!.push(c);
        });

        const segments: SegmentStats[] = Array.from(segmentGroups.entries()).map(([segment, customers]) => ({
            segment,
            count: customers.length,
            avg_monetary: Math.round(customers.reduce((sum, c) => sum + c.monetary, 0) / customers.length),
            avg_frequency: Math.round(customers.reduce((sum, c) => sum + c.frequency, 0) / customers.length * 10) / 10
        }));

        // Sort by value (champions first)
        const segmentOrder: RFMSegment[] = ['champions', 'loyal', 'potential', 'new', 'at_risk', 'hibernating', 'lost'];
        segments.sort((a, b) => segmentOrder.indexOf(a.segment) - segmentOrder.indexOf(b.segment));

        return {
            success: true,
            data: {
                customers: rfmData.sort((a, b) =>
                    (b.r_score + b.f_score + b.m_score) - (a.r_score + a.f_score + a.m_score)
                ),
                segments
            }
        };
    } catch (error: any) {
        console.error('RFM Analysis Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Calculate segment based on RFM scores
 */
function calculateSegment(r: number, f: number, m: number): RFMSegment {
    const avg = (r + f + m) / 3;

    // Champions: High in all areas
    if (r >= 4 && f >= 4 && m >= 4) return 'champions';

    // Loyal: High F and M, decent R
    if (r >= 3 && f >= 4) return 'loyal';

    // New: Recent but low frequency
    if (r >= 4 && f <= 2) return 'new';

    // At Risk: Low R but high historical F
    if (r <= 2 && f >= 3) return 'at_risk';

    // Potential: Medium across the board
    if (avg >= 3) return 'potential';

    // Hibernating: Low R and F
    if (r <= 2 && f <= 2) return 'hibernating';

    // Lost: Very low recency
    if (r === 1) return 'lost';

    return 'potential';
}
