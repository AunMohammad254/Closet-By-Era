'use server';

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActionResult } from '@/types/shared';

// filter_presets is not in the generated Database types, so query it untyped.
const untyped = (client: Awaited<ReturnType<typeof createClient>>) => client as unknown as SupabaseClient;

export interface FilterPreset {
    id: string;
    name: string;
    entity_type: 'orders' | 'products' | 'customers';
    filters: Record<string, unknown>;
    is_default: boolean;
    created_by: string;
    created_at: string;
}

/**
 * Get filter presets for an entity type
 */
export async function getFilterPresets(entityType: 'orders' | 'products' | 'customers'): Promise<ActionResult<FilterPreset[]>> {
    const supabase = await createClient();
    const db = untyped(supabase);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { data, error } = await db
            .from('filter_presets')
            .select('*')
            .eq('entity_type', entityType)
            .or(`created_by.eq.${user.id},is_shared.eq.true`)
            .order('name');

        if (error) {
            console.error('Error fetching filter presets:', error);
            return { success: false, error: 'Failed to fetch presets' };
        }

        return { success: true, data: data || [] };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Create a new filter preset
 */
export async function createFilterPreset(data: {
    name: string;
    entity_type: 'orders' | 'products' | 'customers';
    filters: Record<string, unknown>;
    is_shared?: boolean;
}): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();
    const db = untyped(supabase);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify admin
        const { data: customer } = await supabase
            .from('customers')
            .select('role')
            .eq('auth_id', user.id)
            .single();

        if (customer?.role !== 'admin' && customer?.role !== 'super_admin') {
            return { success: false, error: 'Admin access required' };
        }

        const { data: preset, error } = await db
            .from('filter_presets')
            .insert({
                name: data.name,
                entity_type: data.entity_type,
                filters: data.filters,
                is_shared: data.is_shared || false,
                created_by: user.id
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating filter preset:', error);
            return { success: false, error: 'Failed to create preset' };
        }

        return { success: true, data: { id: preset.id } };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Update a filter preset
 */
export async function updateFilterPreset(
    presetId: string,
    data: { name?: string; filters?: Record<string, unknown>; is_shared?: boolean }
): Promise<ActionResult> {
    const supabase = await createClient();
    const db = untyped(supabase);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { error } = await db
            .from('filter_presets')
            .update(data)
            .eq('id', presetId)
            .eq('created_by', user.id);

        if (error) {
            console.error('Error updating filter preset:', error);
            return { success: false, error: 'Failed to update preset' };
        }

        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Delete a filter preset
 */
export async function deleteFilterPreset(presetId: string): Promise<ActionResult> {
    const supabase = await createClient();
    const db = untyped(supabase);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { error } = await db
            .from('filter_presets')
            .delete()
            .eq('id', presetId)
            .eq('created_by', user.id);

        if (error) {
            console.error('Error deleting filter preset:', error);
            return { success: false, error: 'Failed to delete preset' };
        }

        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Set a preset as default
 */
export async function setDefaultPreset(
    presetId: string,
    entityType: 'orders' | 'products' | 'customers'
): Promise<ActionResult> {
    const supabase = await createClient();
    const db = untyped(supabase);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Remove default from other presets
        await db
            .from('filter_presets')
            .update({ is_default: false })
            .eq('entity_type', entityType)
            .eq('created_by', user.id);

        // Set this one as default
        const { error } = await db
            .from('filter_presets')
            .update({ is_default: true })
            .eq('id', presetId);

        if (error) {
            console.error('Error setting default preset:', error);
            return { success: false, error: 'Failed to set default' };
        }

        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}
