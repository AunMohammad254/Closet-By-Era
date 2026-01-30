'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { ActionResult } from '@/types/shared';

// Interface matching the store_settings table
export interface StoreSettings {
    id: string;
    store_name: string;
    support_email: string;
    support_phone: string;
    currency: string;
    // JSONB columns typed as objects
    payment_methods: {
        stripe: boolean;
        cod: boolean;
    };
    content: {
        hero_title: string;
        hero_subtitle: string;
        announcement_bar: string;
    };
    updated_at: string;
}

// Default settings in case DB is empty (failsafe)
const DEFAULT_SETTINGS: StoreSettings = {
    id: 'default',
    store_name: 'Closet By Era',
    support_email: 'support@closetbyera.com',
    support_phone: '',
    currency: 'PKR',
    payment_methods: { stripe: true, cod: true },
    content: {
        hero_title: 'New Collection',
        hero_subtitle: 'Discover the latest trends',
        announcement_bar: 'Free shipping on orders over PKR 5000'
    },
    updated_at: new Date().toISOString()
};

export async function getStoreSettings(): Promise<ActionResult<StoreSettings>> {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from('store_settings' as any)
            .select('*')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return { success: true, data: DEFAULT_SETTINGS };
            }
            throw error;
        }

        return { success: true, data: data as unknown as StoreSettings };
    } catch (error: any) {
        logger.error('Error fetching settings', error);
        return { success: false, error: error.message };
    }
}

export async function updateStoreSettings(data: Partial<StoreSettings>): Promise<ActionResult> {
    const supabase = await createClient();
    try {
        // Verify Admin Role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { data: customer } = await supabase
            .from('customers')
            .select('role')
            .eq('auth_id', user.id)
            .single();

        if (customer?.role !== 'admin') {
            return { success: false, error: 'Forbidden: Admin access required' };
        }

        // Get ID of the single row
        const { data: current } = await supabase.from('store_settings' as any).select('id').single() as { data: { id: string } | null, error: any };

        if (!current) {
            return { success: false, error: 'Settings not initialized' };
        }

        const updateData = {
            ...data,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('store_settings' as any)
            .update(updateData)
            .eq('id', current.id);

        if (error) throw error;

        revalidatePath('/admin/settings');
        revalidatePath('/', 'layout'); // Update storefront too

        return { success: true };
    } catch (error: any) {
        logger.error('Error updating settings', error);
        return { success: false, error: error.message };
    }
}
