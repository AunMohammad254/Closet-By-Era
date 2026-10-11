'use server';

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';
import { getAdminContext, FORBIDDEN } from '@/lib/auth';
import type { Database } from '@/types/supabase';

interface Promotion {
    id: string;
    name: string;
    type: 'flash_sale' | 'bundle' | 'bogo';
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    created_at: string;
}

// Table columns are start_date/end_date; the admin UI uses starts_at/ends_at.
function toPromotion(row: Database['public']['Tables']['promotions']['Row']): Promotion {
    return {
        id: row.id,
        name: row.name,
        type: row.type as Promotion['type'],
        discount_type: row.discount_type === 'fixed' ? 'fixed' : 'percentage',
        discount_value: row.discount_value,
        starts_at: row.start_date,
        ends_at: row.end_date,
        is_active: row.is_active ?? false,
        created_at: row.created_at,
    };
}

/**
 * Get all promotions
 */
export async function getPromotions(): Promise<ActionResult<Promotion[]>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { data, error } = await ctx.supabase
        .from('promotions')
        .select('*')
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Error fetching promotions:', error);
        return { success: false, error: 'Failed to fetch promotions' };
    }

    return { success: true, data: data.map(toPromotion) };
}

/**
 * Create a promotion
 */
export async function createPromotion(data: {
    name: string;
    type: 'flash_sale' | 'bundle' | 'bogo';
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    starts_at: string;
    ends_at: string;
}): Promise<ActionResult<{ id: string }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    if (!(data.discount_value > 0) || (data.discount_type === 'percentage' && data.discount_value > 100)) {
        return { success: false, error: 'Invalid discount value' };
    }
    if (new Date(data.ends_at) <= new Date(data.starts_at)) {
        return { success: false, error: 'End date must be after start date' };
    }

    // discount_type requires migration 20261011000000_security_hardening.sql.
    const { data: promo, error } = await ctx.supabase
        .from('promotions')
        .insert({
            name: data.name,
            type: data.type,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            start_date: data.starts_at,
            end_date: data.ends_at,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating promotion:', error);
        return { success: false, error: 'Failed to create promotion' };
    }

    revalidatePath('/admin/promotions');
    return { success: true, data: { id: promo.id } };
}

/**
 * Toggle promotion active status
 */
export async function togglePromotion(promoId: string, isActive: boolean): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { error } = await ctx.supabase
        .from('promotions')
        .update({ is_active: isActive })
        .eq('id', promoId);

    if (error) {
        console.error('Error toggling promotion:', error);
        return { success: false, error: 'Failed to update promotion' };
    }

    revalidatePath('/admin/promotions');
    return { success: true };
}

/**
 * Delete a promotion
 */
export async function deletePromotion(promoId: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { error } = await ctx.supabase
        .from('promotions')
        .delete()
        .eq('id', promoId);

    if (error) {
        console.error('Error deleting promotion:', error);
        return { success: false, error: 'Failed to delete promotion' };
    }

    revalidatePath('/admin/promotions');
    return { success: true };
}
