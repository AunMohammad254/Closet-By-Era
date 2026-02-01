'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';

// Types
interface ShippingZone {
    id: string;
    name: string;
    countries: string[];
    is_active: boolean;
    created_at: string;
    rates?: ShippingRate[];
}

interface ShippingRate {
    id: string;
    zone_id: string;
    name: string;
    min_order_amount: number;
    max_order_amount: number | null;
    rate: number;
    estimated_days: string | null;
    created_at: string;
}

/**
 * Get all shipping zones with their rates
 */
export async function getShippingZones(): Promise<ActionResult<ShippingZone[]>> {
    const supabase = await createClient();

    try {
        const { data, error } = await (supabase as any)
            .from('shipping_zones')
            .select(`
                *,
                rates:shipping_rates(*)
            `)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching shipping zones:', error);
            return { success: false, error: 'Failed to fetch shipping zones' };
        }

        return { success: true, data: data || [] };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Create a shipping zone
 */
export async function createShippingZone(data: {
    name: string;
    countries: string[];
}): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();

    try {
        const { data: zone, error } = await (supabase as any)
            .from('shipping_zones')
            .insert({
                name: data.name,
                countries: data.countries
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating shipping zone:', error);
            return { success: false, error: 'Failed to create shipping zone' };
        }

        revalidatePath('/admin/shipping');
        return { success: true, data: { id: zone.id } };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Create a shipping rate for a zone
 */
export async function createShippingRate(data: {
    zone_id: string;
    name: string;
    min_order_amount: number;
    max_order_amount?: number;
    rate: number;
    estimated_days?: string;
}): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();

    try {
        const { data: rateData, error } = await (supabase as any)
            .from('shipping_rates')
            .insert({
                zone_id: data.zone_id,
                name: data.name,
                min_order_amount: data.min_order_amount,
                max_order_amount: data.max_order_amount || null,
                rate: data.rate,
                estimated_days: data.estimated_days || null
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating shipping rate:', error);
            return { success: false, error: 'Failed to create shipping rate' };
        }

        revalidatePath('/admin/shipping');
        return { success: true, data: { id: rateData.id } };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Delete a shipping zone (cascades to rates)
 */
export async function deleteShippingZone(zoneId: string): Promise<ActionResult> {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from('shipping_zones')
            .delete()
            .eq('id', zoneId);

        if (error) {
            console.error('Error deleting shipping zone:', error);
            return { success: false, error: 'Failed to delete shipping zone' };
        }

        revalidatePath('/admin/shipping');
        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}
