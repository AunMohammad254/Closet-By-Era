'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

export type CouponFormData = Omit<Coupon, 'id' | 'usage_count' | 'created_at' | 'uses_count' | 'start_date' | 'end_date' | 'usage_limit'> & {
    start_date: string;
    end_date: string;
    usage_limit: number | null;
};

export async function createCoupon(data: CouponFormData) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('coupons')
            .insert({
                ...data,
                starts_at: data.start_date,
                ends_at: data.end_date,
                max_uses: data.usage_limit
            });

        if (error) {
            console.error('Create Coupon Error:', error);
            if (error.code === '23505') return { error: 'Coupon code already exists.' };
            return { error: 'Failed to create coupon.' };
        }

        revalidatePath('/dashboard/coupons');
        return { success: true };
    } catch (err) {
        return { error: 'Unexpected error.' };
    }
}

export async function updateCoupon(id: string, data: Partial<CouponFormData>) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('coupons')
            .update({
                ...data,
                starts_at: data.start_date,
                ends_at: data.end_date,
                max_uses: data.usage_limit
            })
            .eq('id', id);

        if (error) {
            console.error('Update Coupon Error:', error);
            return { error: 'Failed to update coupon.' };
        }

        revalidatePath('/dashboard/coupons');
        return { success: true };
    } catch (err) {
        return { error: 'Unexpected error.' };
    }
}

export async function deleteCoupon(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) return { error: 'Failed to delete coupon.' };

        revalidatePath('/dashboard/coupons');
        return { success: true };
    } catch (err) {
        return { error: 'Unexpected error.' };
    }
}

export async function getCoupons() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Get Coupons Error:', error);
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
