'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CouponFormSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';

import { ActionResult } from '@/types/shared';

export interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    start_date?: string; // mapped from starts_at
    end_date?: string;   // mapped from ends_at
    usage_limit?: number | null; // mapped from max_uses
    usage_count?: number; // mapped from uses_count
    starts_at: string | null;
    ends_at: string | null;
    max_uses: number | null;
    uses_count: number | null;
    is_active: boolean;
}

export type CouponFormData = Omit<Coupon, 'id' | 'usage_count' | 'created_at' | 'uses_count' | 'start_date' | 'end_date' | 'usage_limit' | 'starts_at' | 'ends_at' | 'max_uses'> & {
    start_date: string;
    end_date: string;
    usage_limit: number | null;
};

export async function createCoupon(data: CouponFormData): Promise<ActionResult> {
    // Rate limiting
    const rateCheck = await checkRateLimit('admin-user', 'createCoupon', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    // Validate input with Zod
    const validation = CouponFormSchema.safeParse(data);
    if (!validation.success) {
        const errorMessage = validation.error.issues.map(e => e.message).join(', ');
        logger.warn('Coupon validation failed', { action: 'createCoupon', errors: errorMessage });
        return { success: false, error: errorMessage };
    }

    try {
        const supabase = await createClient();
        const validData = validation.data;
        const { error } = await supabase
            .from('coupons')
            .insert({
                code: validData.code,
                discount_type: validData.discount_type,
                discount_value: validData.discount_value,
                min_order_amount: validData.min_order_amount,
                is_active: validData.is_active,
                starts_at: validData.start_date || null,
                ends_at: validData.end_date || null,
                max_uses: validData.usage_limit ?? null
            });

        if (error) {
            logger.error('Error creating coupon', error, { action: 'createCoupon' });
            if (error.code === '23505') return { success: false, error: 'Coupon code already exists.' };
            return { success: false, error: 'Failed to create coupon.' };
        }

        revalidatePath('/dashboard/coupons');
        return { success: true };
    } catch (err) {
        logger.error('Unexpected error creating coupon', err as Error, { action: 'createCoupon' });
        return { success: false, error: 'Unexpected error.' };
    }
}

export async function updateCoupon(id: string, data: Partial<CouponFormData>): Promise<ActionResult> {
    // Rate limiting
    const rateCheck = await checkRateLimit('admin-user', 'updateCoupon', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    try {
        const supabase = await createClient();

        // Build update object with only valid database columns
        const updateData: Record<string, unknown> = {};
        if (data.code !== undefined) updateData.code = data.code;
        if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
        if (data.discount_value !== undefined) updateData.discount_value = data.discount_value;
        if (data.min_order_amount !== undefined) updateData.min_order_amount = data.min_order_amount;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;
        if (data.start_date !== undefined) updateData.starts_at = data.start_date;
        if (data.end_date !== undefined) updateData.ends_at = data.end_date;
        if (data.usage_limit !== undefined) updateData.max_uses = data.usage_limit;

        const { error } = await supabase
            .from('coupons')
            .update(updateData)
            .eq('id', id);

        if (error) {
            logger.error('Error updating coupon', error, { action: 'updateCoupon', couponId: id });
            return { success: false, error: 'Failed to update coupon.' };
        }

        revalidatePath('/dashboard/coupons');
        return { success: true };
    } catch (err) {
        logger.error('Unexpected error updating coupon', err as Error, { action: 'updateCoupon', couponId: id });
        return { success: false, error: 'Unexpected error.' };
    }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
    // Rate limiting
    const rateCheck = await checkRateLimit('admin-user', 'deleteCoupon', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('Error deleting coupon', error, { action: 'deleteCoupon', couponId: id });
            return { success: false, error: 'Failed to delete coupon.' };
        }

        revalidatePath('/dashboard/coupons');
        return { success: true };
    } catch (err) {
        logger.error('Unexpected error deleting coupon', err as Error, { action: 'deleteCoupon', couponId: id });
        return { success: false, error: 'Unexpected error.' };
    }
}

export async function getCoupons() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('coupons')
        .select('id, code, discount_type, discount_value, min_order_amount, is_active, starts_at, ends_at, max_uses, uses_count, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Error fetching coupons', error, { action: 'getCoupons' });
        return [];
    }
    return data as Coupon[];
}

export async function validateCoupon(code: string, cartTotal: number) {
    try {
        const supabase = await createClient();
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('is_active', true) // Redundant with RLS but fine
            .single();

        if (error || !coupon) {
            return { valid: false, message: 'Invalid or inactive coupon.' };
        }

        const now = new Date();
        const start = new Date(coupon.starts_at || '');
        const end = new Date(coupon.ends_at || '');

        if (now < start) return { valid: false, message: 'Coupon start date not reached.' };
        if (now > end) return { valid: false, message: 'Coupon expired.' };

        if (coupon.max_uses && (coupon.uses_count || 0) >= coupon.max_uses) {
            return { valid: false, message: 'Coupon usage limit reached.' };
        }

        if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
            return { valid: false, message: `Minimum order amount is PKR ${coupon.min_order_amount}` };
        }

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (cartTotal * coupon.discount_value) / 100;
        } else {
            discount = coupon.discount_value;
        }

        // Cap discount to total amount (no negative total)
        discount = Math.min(discount, cartTotal);

        return {
            valid: true,
            discount,
            coupon,
            message: 'Coupon applied successfully!'
        };
    } catch (err) {
        return { valid: false, message: 'Validation error.' };
    }
}
