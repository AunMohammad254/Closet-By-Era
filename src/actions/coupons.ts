'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    start_date: string;
    end_date: string;
    usage_limit: number | null;
    usage_count: number;
    is_active: boolean;
}

export type CouponFormData = Omit<Coupon, 'id' | 'usage_count' | 'created_at'>;

export async function createCoupon(data: CouponFormData) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('coupons')
            .insert(data);

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
            .update(data)
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
        const start = new Date(coupon.start_date);
        const end = new Date(coupon.end_date);

        if (now < start) return { valid: false, message: 'Coupon start date not reached.' };
        if (now > end) return { valid: false, message: 'Coupon expired.' };

        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return { valid: false, message: 'Coupon usage limit reached.' };
        }

        if (cartTotal < coupon.min_order_amount) {
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
