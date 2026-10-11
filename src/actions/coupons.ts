'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { ActionResult } from '@/types/shared';
import { getAdminContext, getSessionUser, FORBIDDEN } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request';
import { getCouponProblem } from '@/lib/pricing';

export interface Coupon {
    id: string;
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number; // Changed from value
    min_order_amount: number;
    max_uses: number | null; // Changed from usage_limit
    uses_count: number; // Changed from used_count
    ends_at: string | null; // Changed from expires_at
    is_active: boolean;
    created_at: string;
}

const COUPON_COLUMNS = 'id, code, description, discount_type, discount_value, min_order_amount, max_uses, uses_count, ends_at, is_active, created_at';

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unexpected error';
}

// ADMIN ACTIONS

export async function getCoupons(): Promise<ActionResult<Coupon[]>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    try {
        const { data, error } = await ctx.supabase
            .from('coupons')
            .select(COUPON_COLUMNS)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: data as unknown as Coupon[] };
    } catch (error) {
        logger.error('Error fetching coupons', error);
        return { success: false, error: errorMessage(error) };
    }
}

export async function createCoupon(data: Omit<Coupon, 'id' | 'created_at' | 'uses_count'>): Promise<ActionResult<Coupon>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    try {
        // Validate
        if (data.discount_value <= 0) return { success: false, error: 'Value must be positive' };
        if (data.discount_type === 'percentage' && data.discount_value > 100) {
            return { success: false, error: 'Percentage discount cannot exceed 100' };
        }
        if (data.min_order_amount < 0) return { success: false, error: 'Min order amount cannot be negative' };

        const { data: newCoupon, error } = await ctx.supabase
            .from('coupons')
            .insert({
                code: data.code.trim().toUpperCase(),
                description: data.description,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                min_order_amount: data.min_order_amount,
                max_uses: data.max_uses,
                ends_at: data.ends_at,
                is_active: data.is_active,
            })
            .select(COUPON_COLUMNS)
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { success: false, error: 'Coupon code already exists' };
            }
            throw error;
        }

        revalidatePath('/admin/coupons');
        return { success: true, data: newCoupon as unknown as Coupon };
    } catch (error) {
        logger.error('Error creating coupon', error);
        return { success: false, error: errorMessage(error) };
    }
}

export async function updateCoupon(id: string, data: Partial<Omit<Coupon, 'id' | 'created_at' | 'uses_count'>>): Promise<ActionResult<Coupon>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    try {
        // Validate
        if (data.discount_value !== undefined && data.discount_value <= 0) return { success: false, error: 'Value must be positive' };
        if (data.min_order_amount !== undefined && data.min_order_amount < 0) return { success: false, error: 'Min order amount cannot be negative' };

        // Only allow known columns through (the client controls this object).
        const couponData = {
            code: data.code?.trim().toUpperCase(),
            description: data.description,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            min_order_amount: data.min_order_amount,
            max_uses: data.max_uses,
            ends_at: data.ends_at,
            is_active: data.is_active,
        };

        const { data: updatedCoupon, error } = await ctx.supabase
            .from('coupons')
            .update(couponData)
            .eq('id', id)
            .select(COUPON_COLUMNS)
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { success: false, error: 'Coupon code already exists' };
            }
            throw error;
        }

        revalidatePath('/admin/coupons');
        return { success: true, data: updatedCoupon as unknown as Coupon };
    } catch (error) {
        logger.error('Error updating coupon', error);
        return { success: false, error: errorMessage(error) };
    }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    try {
        const { error } = await ctx.supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/coupons');
        return { success: true };
    } catch (error) {
        logger.error('Error deleting coupon', error);
        return { success: false, error: errorMessage(error) };
    }
}

// PUBLIC ACTIONS

/**
 * Checks a coupon for the checkout preview. createOrder re-validates and
 * consumes the coupon; nothing here is trusted for pricing.
 */
export async function validateCoupon(code: string, cartTotal: number): Promise<ActionResult<Coupon>> {
    const session = await getSessionUser();
    const rateKey = session ? `user-${session.user.id}` : `ip-${await getClientIp()}`;
    const rateCheck = await checkRateLimit(rateKey, 'validate-code', { limit: 10, windowSeconds: 300 });
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many attempts. Try again in ${rateCheck.resetIn}s` };
    }

    try {
        // Service role: RLS hides coupons whose start/end dates are NULL.
        const { data: coupon } = await createAdminClient()
            .from('coupons')
            .select(`${COUPON_COLUMNS}, starts_at`)
            .eq('code', code.trim().toUpperCase())
            .maybeSingle();

        if (!coupon) {
            return { success: false, error: 'Invalid coupon code' };
        }

        const problem = getCouponProblem(coupon, cartTotal);
        if (problem) return { success: false, error: problem };

        return { success: true, data: coupon as unknown as Coupon };
    } catch (error) {
        logger.error('Error validating coupon', error);
        // Don't expose internal errors to public
        return { success: false, error: 'Invalid coupon code' };
    }
}

// BULK ACTIONS

/**
 * Bulk toggle coupon active status
 */
export async function bulkToggleCoupons(
    ids: string[],
    isActive: boolean
): Promise<ActionResult<{ updated: number }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    try {
        if (ids.length > 50) return { success: false, error: 'Maximum 50 coupons at once' };

        const { data, error } = await ctx.supabase
            .from('coupons')
            .update({ is_active: isActive })
            .in('id', ids)
            .select('id');

        if (error) throw error;

        revalidatePath('/admin/coupons');
        return { success: true, data: { updated: data?.length || 0 } };
    } catch (error) {
        logger.error('Error bulk toggling coupons', error);
        return { success: false, error: errorMessage(error) };
    }
}

/**
 * Bulk delete coupons
 */
export async function bulkDeleteCoupons(ids: string[]): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    try {
        if (ids.length > 50) return { success: false, error: 'Maximum 50 coupons at once' };

        const { error } = await ctx.supabase
            .from('coupons')
            .delete()
            .in('id', ids);

        if (error) throw error;

        revalidatePath('/admin/coupons');
        return { success: true };
    } catch (error) {
        logger.error('Error bulk deleting coupons', error);
        return { success: false, error: errorMessage(error) };
    }
}

/**
 * Bulk reset coupon usage counts
 */
export async function bulkResetCouponUsage(ids: string[]): Promise<ActionResult<{ updated: number }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    try {
        if (ids.length > 50) return { success: false, error: 'Maximum 50 coupons at once' };

        const { data, error } = await ctx.supabase
            .from('coupons')
            .update({ uses_count: 0 })
            .in('id', ids)
            .select('id');

        if (error) throw error;

        revalidatePath('/admin/coupons');
        return { success: true, data: { updated: data?.length || 0 } };
    } catch (error) {
        logger.error('Error resetting coupon usage', error);
        return { success: false, error: errorMessage(error) };
    }
}
