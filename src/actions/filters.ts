'use server';

import { z } from 'zod';
import { getAdminContext, FORBIDDEN } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ActionResult } from '@/types/shared';
import type { Tables } from '@/types/supabase';

// Saved filter presets live in admin_saved_filters, one set per staff member
// (admin_id = customers.id); `page` is the admin list they belong to.

export type FilterEntity = 'orders' | 'products' | 'customers';
export type FilterValues = Record<string, string>;

export interface FilterPreset {
    id: string;
    name: string;
    entity_type: FilterEntity;
    filters: FilterValues;
    is_default: boolean;
    created_at: string;
}

const EntitySchema = z.enum(['orders', 'products', 'customers']);
const NameSchema = z.string().trim().min(1).max(60);
const FiltersSchema = z
    .record(z.string().max(50), z.string().max(200))
    .refine(filters => Object.keys(filters).length <= 20);

function toPreset(row: Pick<Tables<'admin_saved_filters'>, 'id' | 'name' | 'page' | 'filters' | 'is_default' | 'created_at'>): FilterPreset {
    const parsed = FiltersSchema.safeParse(row.filters);
    return {
        id: row.id,
        name: row.name,
        entity_type: row.page as FilterEntity,
        filters: parsed.success ? parsed.data : {},
        is_default: row.is_default,
        created_at: row.created_at,
    };
}

export async function getFilterPresets(entityType: FilterEntity): Promise<ActionResult<FilterPreset[]>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    if (!EntitySchema.safeParse(entityType).success) return { success: false, error: 'Invalid list' };

    const { data, error } = await ctx.supabase
        .from('admin_saved_filters')
        .select('id, name, page, filters, is_default, created_at')
        .eq('admin_id', ctx.customerId)
        .eq('page', entityType)
        .order('name');

    if (error) {
        logger.error('Error fetching filter presets', error, { action: 'getFilterPresets' });
        return { success: false, error: 'Failed to fetch presets' };
    }

    return { success: true, data: data.map(toPreset) };
}

export async function createFilterPreset(input: {
    name: string;
    entity_type: FilterEntity;
    filters: FilterValues;
}): Promise<ActionResult<{ id: string }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const parsed = z.object({ name: NameSchema, entity_type: EntitySchema, filters: FiltersSchema }).safeParse(input);
    if (!parsed.success) return { success: false, error: 'Give the preset a name (up to 60 characters)' };

    const { data, error } = await ctx.supabase
        .from('admin_saved_filters')
        .insert({
            admin_id: ctx.customerId,
            name: parsed.data.name,
            page: parsed.data.entity_type,
            filters: parsed.data.filters,
        })
        .select('id')
        .single();

    if (error) {
        logger.error('Error creating filter preset', error, { action: 'createFilterPreset' });
        return { success: false, error: 'Failed to create preset' };
    }

    return { success: true, data: { id: data.id } };
}

export async function updateFilterPreset(
    presetId: string,
    input: { name?: string; filters?: FilterValues }
): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const parsed = z.object({ name: NameSchema.optional(), filters: FiltersSchema.optional() }).safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid preset' };

    const { data, error } = await ctx.supabase
        .from('admin_saved_filters')
        .update(parsed.data)
        .eq('id', presetId)
        .eq('admin_id', ctx.customerId)
        .select('id');

    if (error || !data.length) {
        if (error) logger.error('Error updating filter preset', error, { action: 'updateFilterPreset' });
        return { success: false, error: 'Failed to update preset' };
    }

    return { success: true };
}

export async function deleteFilterPreset(presetId: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const { error } = await ctx.supabase
        .from('admin_saved_filters')
        .delete()
        .eq('id', presetId)
        .eq('admin_id', ctx.customerId);

    if (error) {
        logger.error('Error deleting filter preset', error, { action: 'deleteFilterPreset' });
        return { success: false, error: 'Failed to delete preset' };
    }

    return { success: true };
}

/** Makes one preset the default for that list (applied when the list opens unfiltered). */
export async function setDefaultPreset(presetId: string, entityType: FilterEntity): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    if (!EntitySchema.safeParse(entityType).success) return { success: false, error: 'Invalid list' };

    // A unique index allows one default per admin and list, so clear first.
    const { error: clearError } = await ctx.supabase
        .from('admin_saved_filters')
        .update({ is_default: false })
        .eq('admin_id', ctx.customerId)
        .eq('page', entityType)
        .eq('is_default', true);

    const { data, error } = clearError
        ? { data: null, error: clearError }
        : await ctx.supabase
            .from('admin_saved_filters')
            .update({ is_default: true })
            .eq('id', presetId)
            .eq('admin_id', ctx.customerId)
            .eq('page', entityType)
            .select('id');

    if (error || !data?.length) {
        if (error) logger.error('Error setting default preset', error, { action: 'setDefaultPreset' });
        return { success: false, error: 'Failed to set default' };
    }

    return { success: true };
}
