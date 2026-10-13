'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { ActionResult } from '@/types/shared';
import { getAdminContext, getSessionUser, FORBIDDEN } from '@/lib/auth';
import { logger } from '@/lib/logger';

export interface LoyaltyHistory {
    id: string;
    points: number;
    reason: string;
    created_at: string;
}

// Points are awarded server-side by createOrder (src/actions/orders.ts).
// loyalty_history is keyed by auth user id (user_id -> auth.users.id).

type Session = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

async function readBalance(session: Session): Promise<number> {
    const { data: customer } = await session.supabase
        .from('customers')
        .select('loyalty_points')
        .eq('auth_id', session.user.id)
        .single();

    return customer?.loyalty_points || 0;
}

async function readHistory(session: Session): Promise<LoyaltyHistory[]> {
    const { data: history } = await session.supabase
        .from('loyalty_history')
        .select('id, points, reason, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    return (history as LoyaltyHistory[]) || [];
}

export async function getLoyaltyBalance() {
    const session = await getSessionUser();
    return session ? readBalance(session) : 0;
}

export async function getLoyaltyHistory() {
    const session = await getSessionUser();
    return session ? readHistory(session) : [];
}

/**
 * Balance and history together. The browser sends Server Actions one at a time,
 * so two separate calls cost two round trips and two auth checks.
 */
export async function getLoyaltySummary(): Promise<{ points: number; history: LoyaltyHistory[] }> {
    const session = await getSessionUser();
    if (!session) return { points: 0, history: [] };

    const [points, history] = await Promise.all([readBalance(session), readHistory(session)]);
    return { points, history };
}

// ========== Admin Functions ==========

export interface CustomerWithLoyalty {
    id: string;
    auth_id: string;
    first_name: string;
    last_name: string;
    email: string;
    loyalty_points: number;
}

export interface CustomerLoyaltyHistory extends LoyaltyHistory {
    customer_name?: string;
}

/** Strip characters that have meaning inside a PostgREST or() filter. */
function sanitizeSearch(term: string): string {
    return term.replace(/[,()*%\\]/g, ' ').trim().slice(0, 100);
}

// Admin: Get all customers with loyalty points
export async function getAllCustomersWithLoyalty(
    page: number = 1,
    pageSize: number = 20,
    search?: string
): Promise<{ customers: CustomerWithLoyalty[]; total: number }> {
    const ctx = await getAdminContext();
    if (!ctx) return { customers: [], total: 0 };

    let query = ctx.supabase
        .from('customers')
        .select('id, auth_id, first_name, last_name, email, loyalty_points', { count: 'exact' });

    const term = search ? sanitizeSearch(search) : '';
    if (term) {
        query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const size = Math.min(Math.max(pageSize, 1), 100);
    const { data: customers, count, error } = await query
        .order('loyalty_points', { ascending: false })
        .range((page - 1) * size, page * size - 1);

    if (error) {
        logger.error('Get customers loyalty error', error);
        return { customers: [], total: 0 };
    }

    return {
        customers: (customers || []).map(c => ({
            id: c.id,
            auth_id: c.auth_id || '',
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            email: c.email || '',
            loyalty_points: c.loyalty_points || 0
        })),
        total: count || 0
    };
}

// Admin: Adjust customer loyalty points
export async function adjustLoyaltyPoints(
    customerId: string,
    adjustment: number,
    reason: string
): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    if (!Number.isInteger(adjustment) || adjustment === 0 || Math.abs(adjustment) > 1_000_000) {
        return { success: false, error: 'Adjustment must be a non-zero whole number' };
    }

    try {
        const { data: customer } = await ctx.supabase
            .from('customers')
            .select('loyalty_points, auth_id')
            .eq('id', customerId)
            .single();

        if (!customer) {
            return { success: false, error: "Customer not found" };
        }

        const newBalance = Math.max(0, (customer.loyalty_points || 0) + adjustment);

        const { error: updateError } = await ctx.supabase
            .from('customers')
            .update({ loyalty_points: newBalance })
            .eq('id', customerId);

        if (updateError) {
            logger.error('Update loyalty points error', updateError);
            return { success: false, error: "Failed to update points" };
        }

        // loyalty_history has no INSERT policy for app users; write with the service role.
        if (customer.auth_id) {
            await createAdminClient()
                .from('loyalty_history')
                .insert({
                    user_id: customer.auth_id,
                    points: adjustment,
                    reason: reason || (adjustment > 0 ? 'Admin adjustment (credit)' : 'Admin adjustment (debit)')
                });
        }

        revalidatePath('/admin/loyalty');
        return { success: true, message: `Points ${adjustment > 0 ? 'added' : 'deducted'} successfully. New balance: ${newBalance}` };
    } catch (err) {
        logger.error('Adjust loyalty points exception', err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

// Admin: Get loyalty history for a specific customer
export async function getCustomerLoyaltyHistory(customerId: string): Promise<LoyaltyHistory[]> {
    const ctx = await getAdminContext();
    if (!ctx) return [];

    const { data: customer } = await ctx.supabase
        .from('customers')
        .select('auth_id')
        .eq('id', customerId)
        .single();

    if (!customer?.auth_id) return [];

    // RLS only lets users read their own history, so admins read via the service role.
    const { data: history, error } = await createAdminClient()
        .from('loyalty_history')
        .select('id, points, reason, created_at')
        .eq('user_id', customer.auth_id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        logger.error('Get customer loyalty history error', error);
        return [];
    }

    return (history || []) as LoyaltyHistory[];
}
