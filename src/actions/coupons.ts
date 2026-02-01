'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { ActionResult } from '@/types/shared';

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

// ADMIN ACTIONS

export async function getCoupons(): Promise<ActionResult<Coupon[]>> {
    const supabase = await createClient();
    try {
        // Auth check happens via RLS mostly, but strict admin check is better for actions
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { data: customer } = await supabase.from('customers').select('role').eq('auth_id', user.id).single();
        if (customer?.role !== 'admin') return { success: false, error: 'Forbidden' };

        const { data, error } = await supabase
            .from('coupons' as any)
            .select('id, code, description, discount_type, discount_value, min_order_amount, max_uses, uses_count, ends_at, is_active, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: data as unknown as Coupon[] };
    } catch (error: any) {
        logger.error('Error fetching coupons', error);
        return { success: false, error: error.message };
    }
}

export async function createCoupon(data: Omit<Coupon, 'id' | 'created_at' | 'uses_count'>): Promise<ActionResult<Coupon>> {
    const supabase = await createClient();
    try {
        // Verify Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };
        const { data: customer } = await supabase.from('customers').select('role').eq('auth_id', user.id).single();
        if (customer?.role !== 'admin') return { success: false, error: 'Forbidden' };

        // Validate
        if (data.discount_value <= 0) return { success: false, error: 'Value must be positive' };
        if (data.min_order_amount < 0) return { success: false, error: 'Min order amount cannot be negative' };

        const couponData = {
            ...data,
            code: data.code.toUpperCase(),
        };

        const { data: newCoupon, error } = await supabase
            .from('coupons' as any)
            .insert({
                code: couponData.code,
                description: couponData.description,
                discount_type: couponData.discount_type,
                discount_value: couponData.discount_value,
                min_order_amount: couponData.min_order_amount,
                max_uses: couponData.max_uses,
                ends_at: couponData.ends_at,
                is_active: couponData.is_active,
            })
            .select('id, code, description, discount_type, discount_value, min_order_amount, max_uses, uses_count, ends_at, is_active, created_at')
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { success: false, error: 'Coupon code already exists' };
            }
            throw error;
        }

        revalidatePath('/admin/coupons');
        return { success: true, data: newCoupon as unknown as Coupon };
    } catch (error: any) {
        logger.error('Error creating coupon', error);
        return { success: false, error: error.message };
    }
}

export async function updateCoupon(id: string, data: Partial<Omit<Coupon, 'id' | 'created_at' | 'uses_count'>>): Promise<ActionResult<Coupon>> {
    const supabase = await createClient();
    try {
        // Verify Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };
        const { data: customer } = await supabase.from('customers').select('role').eq('auth_id', user.id).single();
        if (customer?.role !== 'admin') return { success: false, error: 'Forbidden' };

        // Validate
        if (data.discount_value !== undefined && data.discount_value <= 0) return { success: false, error: 'Value must be positive' };
        if (data.min_order_amount !== undefined && data.min_order_amount < 0) return { success: false, error: 'Min order amount cannot be negative' };

        // Upper case code if provided
        const couponData = { ...data };
        if (couponData.code) {
            couponData.code = couponData.code.toUpperCase();
        }

        const { data: updatedCoupon, error } = await supabase
            .from('coupons' as any)
            .update(couponData)
            .eq('id', id)
            .select('id, code, description, discount_type, discount_value, min_order_amount, max_uses, uses_count, ends_at, is_active, created_at')
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { success: false, error: 'Coupon code already exists' };
            }
            throw error;
        }

        revalidatePath('/admin/coupons');
        return { success: true, data: updatedCoupon as unknown as Coupon };
    } catch (error: any) {
        logger.error('Error updating coupon', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        // Verify Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };
        const { data: customer } = await supabase.from('customers').select('role').eq('auth_id', user.id).single();
        if (customer?.role !== 'admin') return { success: false, error: 'Forbidden' };

        const { error } = await supabase
            .from('coupons' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/coupons');
        return { success: true };
    } catch (error: any) {
        logger.error('Error deleting coupon', error);
        return { success: false, error: error.message };
    }
}

// PUBLIC ACTIONS

export async function validateCoupon(code: string, cartTotal: number): Promise<ActionResult<Coupon>> {
    const supabase = await createClient();
    try {
        // Note: Ideally use rate limiting here

        const { data: coupon, error } = await supabase
            .from('coupons' as any)
            .select('id, code, description, discount_type, discount_value, min_order_amount, max_uses, uses_count, ends_at, is_active, created_at')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !coupon) {
            return { success: false, error: 'Invalid coupon code' };
        }

        const typedCoupon = coupon as unknown as Coupon;

        // Check Expiry
        if (typedCoupon.ends_at && new Date() > new Date(typedCoupon.ends_at)) {
            return { success: false, error: 'Coupon has expired' };
        }

        // Check Usage Limit
        if (typedCoupon.max_uses !== null && typedCoupon.uses_count >= typedCoupon.max_uses) {
            return { success: false, error: 'Coupon usage limit reached' };
        }

        // Check Min Order
        if (cartTotal < typedCoupon.min_order_amount) {
            return {
                success: false,
                error: `Minimum order of ${typedCoupon.min_order_amount} required`
            };
        }

        return { success: true, data: typedCoupon };
    } catch (error: any) {
        logger.error('Error validating coupon', error);
        // Don't expose internal errors to public
        return { success: false, error: 'Invalid coupon code' };
    }
}

export async function incrementCouponUsage(code: string): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        // Cast to any to bypass strict type checking if RPC is not in generated types
        // Note: You might need to update the RPC function to use proper column names too if needed
        const { error } = await supabase.rpc('increment_coupon_usage' as any, {
            coupon_code: code.toUpperCase()
        });

        if (error) {
            // If RPC missing, fallback to simple update
            if (error.code === 'PGRST202' || error.message.includes('function')) {
                const { data } = await supabase
                    .from('coupons' as any)
                    .select('id, uses_count')
                    .eq('code', code.toUpperCase())
                    .single();

                const coupon = data as any;

                if (coupon) {
                    await supabase
                        .from('coupons' as any)
                        .update({ uses_count: (coupon.uses_count || 0) + 1 })
                        .eq('id', coupon.id);
                    return { success: true };
                }
            }
            throw error;
        }

        return { success: true };
    } catch (error: any) {
        logger.error('Error incrementing coupon usage', error);
        return { success: false, error: error.message };
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
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };
        const { data: customer } = await supabase.from('customers').select('role').eq('auth_id', user.id).single();
        if (customer?.role !== 'admin') return { success: false, error: 'Forbidden' };

        if (ids.length > 50) return { success: false, error: 'Maximum 50 coupons at once' };

        const { data, error } = await supabase
            .from('coupons' as any)
            .update({ is_active: isActive })
            .in('id', ids)
            .select('id');

        if (error) throw error;

        revalidatePath('/admin/coupons');
        return { success: true, data: { updated: (data as any[])?.length || 0 } };
    } catch (error: any) {
        logger.error('Error bulk toggling coupons', error);
        return { success: false, error: error.message };
    }
}

/**
 * Bulk delete coupons
 */
export async function bulkDeleteCoupons(ids: string[]): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };
        const { data: customer } = await supabase.from('customers').select('role').eq('auth_id', user.id).single();
        if (customer?.role !== 'admin') return { success: false, error: 'Forbidden' };

        if (ids.length > 50) return { success: false, error: 'Maximum 50 coupons at once' };

        const { error } = await supabase
            .from('coupons' as any)
            .delete()
            .in('id', ids);

        if (error) throw error;

        revalidatePath('/admin/coupons');
        return { success: true };
    } catch (error: any) {
        logger.error('Error bulk deleting coupons', error);
        return { success: false, error: error.message };
    }
}

/**
 * Bulk reset coupon usage counts
 */
export async function bulkResetCouponUsage(ids: string[]): Promise<ActionResult<{ updated: number }>> {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };
        const { data: customer } = await supabase.from('customers').select('role').eq('auth_id', user.id).single();
        if (customer?.role !== 'admin') return { success: false, error: 'Forbidden' };

        if (ids.length > 50) return { success: false, error: 'Maximum 50 coupons at once' };

        const { data, error } = await supabase
            .from('coupons' as any)
            .update({ uses_count: 0 })
            .in('id', ids)
            .select('id');

        if (error) throw error;

        revalidatePath('/admin/coupons');
        return { success: true, data: { updated: (data as any[])?.length || 0 } };
    } catch (error: any) {
        logger.error('Error resetting coupon usage', error);
        return { success: false, error: error.message };
    }
}

