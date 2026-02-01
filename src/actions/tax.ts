'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';

interface TaxRule {
    id: string;
    name: string;
    region: string | null;
    rate: number;
    applies_to: 'all' | 'products' | 'shipping';
    is_active: boolean;
    created_at: string;
}

/**
 * Get all tax rules
 */
export async function getTaxRules(): Promise<ActionResult<TaxRule[]>> {
    const supabase = await createClient();

    try {
        const { data, error } = await (supabase as any)
            .from('tax_rules')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching tax rules:', error);
            return { success: false, error: 'Failed to fetch tax rules' };
        }

        return { success: true, data: data || [] };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Create a tax rule
 */
export async function createTaxRule(data: {
    name: string;
    region?: string;
    rate: number;
    applies_to: 'all' | 'products' | 'shipping';
}): Promise<ActionResult<{ id: string }>> {
    const supabase = await createClient();

    try {
        const { data: rule, error } = await (supabase as any)
            .from('tax_rules')
            .insert({
                name: data.name,
                region: data.region || null,
                rate: data.rate,
                applies_to: data.applies_to
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating tax rule:', error);
            return { success: false, error: 'Failed to create tax rule' };
        }

        revalidatePath('/admin/tax');
        return { success: true, data: { id: rule.id } };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Toggle tax rule active status
 */
export async function toggleTaxRule(ruleId: string, isActive: boolean): Promise<ActionResult> {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from('tax_rules')
            .update({ is_active: isActive })
            .eq('id', ruleId);

        if (error) {
            console.error('Error toggling tax rule:', error);
            return { success: false, error: 'Failed to update tax rule' };
        }

        revalidatePath('/admin/tax');
        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Delete a tax rule
 */
export async function deleteTaxRule(ruleId: string): Promise<ActionResult> {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from('tax_rules')
            .delete()
            .eq('id', ruleId);

        if (error) {
            console.error('Error deleting tax rule:', error);
            return { success: false, error: 'Failed to delete tax rule' };
        }

        revalidatePath('/admin/tax');
        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}
