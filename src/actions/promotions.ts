'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';

interface Promotion {
    id: string;
    name: string;
    type: 'flash_sale' | 'bundle' | 'bogo';
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    product_ids: string[] | null;
    min_quantity: number | null;
    created_at: string;
}

/**
 * Get all promotions
 */
export async function getPromotions(): Promise<ActionResult<Promotion[]>> {
    const supabase = await createClient();

    try {
        const { data, error } = await (supabase as any)
            .from('promotions')
            .select('*')
            .order('starts_at', { ascending: false });

        if (error) {
            console.error('Error fetching promotions:', error);
            return { success: false, error: 'Failed to fetch promotions' };
        }

        return { success: true, data: data || [] };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
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
    product_ids?: string[];
    min_quantity?: number;
}): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();

    try {
        const { data: promo, error } = await (supabase as any)
            .from('promotions')
            .insert({
                name: data.name,
                type: data.type,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                starts_at: data.starts_at,
                ends_at: data.ends_at,
                product_ids: data.product_ids || null,
                min_quantity: data.min_quantity || null
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating promotion:', error);
            return { success: false, error: 'Failed to create promotion' };
        }

        revalidatePath('/admin/promotions');
        return { success: true, data: { id: promo.id } };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Toggle promotion active status
 */
export async function togglePromotion(promoId: string, isActive: boolean): Promise<ActionResult> {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from('promotions')
            .update({ is_active: isActive })
            .eq('id', promoId);

        if (error) {
            console.error('Error toggling promotion:', error);
            return { success: false, error: 'Failed to update promotion' };
        }

        revalidatePath('/admin/promotions');
        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Delete a promotion
 */
export async function deletePromotion(promoId: string): Promise<ActionResult> {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from('promotions')
            .delete()
            .eq('id', promoId);

        if (error) {
            console.error('Error deleting promotion:', error);
            return { success: false, error: 'Failed to delete promotion' };
        }

        revalidatePath('/admin/promotions');
        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}
