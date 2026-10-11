import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/** 1 point for every PKR 100 actually paid. */
export const POINTS_PER_PKR = 1 / 100;

/**
 * Credits an order's loyalty points to the customer and logs them. Called when
 * the order is placed (COD, transfers, gift card) or, for card orders, once
 * Stripe reports the payment. Never throws: points must not fail an order.
 */
export async function awardLoyaltyPoints(customerId: string, amountPaid: number, orderNumber: string): Promise<void> {
    const points = Math.floor(amountPaid * POINTS_PER_PKR);
    if (points <= 0) return;

    const admin = createAdminClient();
    try {
        const { data: customer } = await admin
            .from('customers')
            .select('loyalty_points, auth_id')
            .eq('id', customerId)
            .single();
        if (!customer) return;

        await admin
            .from('customers')
            .update({ loyalty_points: (customer.loyalty_points ?? 0) + points })
            .eq('id', customerId);

        // loyalty_history is keyed by the auth user id.
        if (customer.auth_id) {
            await admin.from('loyalty_history').insert({
                user_id: customer.auth_id,
                points,
                reason: `Earned from order ${orderNumber}`,
            });
        }
    } catch (error) {
        logger.error('Failed to award loyalty points', error, { action: 'awardLoyaltyPoints', orderNumber });
    }
}
