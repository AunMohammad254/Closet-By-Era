'use server';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { ActionResult } from '@/types/shared';
import { getAdminContext, FORBIDDEN } from '@/lib/auth';
import { normalizePaymentSettings, type PaymentSettings } from '@/lib/payments';
import type { Json } from '@/types/supabase';
import { getStripeMode, type StripeMode } from '@/lib/stripe';
import { describeEmailProviders, getSender, type EmailProviderId } from '@/lib/email/transport';

// Interface matching the store_settings table
export interface StoreSettings {
    id: string;
    store_name: string;
    support_email: string;
    support_phone: string;
    currency: string;
    // JSONB columns typed as objects
    payment_methods: PaymentSettings;
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
    payment_methods: normalizePaymentSettings(null),
    content: {
        hero_title: 'New Collection',
        hero_subtitle: 'Discover the latest trends',
        announcement_bar: 'Free shipping on orders over PKR 5000'
    },
    updated_at: new Date().toISOString()
};

export async function getStoreSettings(): Promise<ActionResult<StoreSettings>> {
    return readStoreSettings();
}

// The shop layout and the home page both need the settings: one query per request.
const readStoreSettings = cache(async (): Promise<ActionResult<StoreSettings>> => {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return { success: true, data: DEFAULT_SETTINGS };
            }
            throw error;
        }

        const settings = data as unknown as StoreSettings;
        return {
            success: true,
            data: { ...settings, payment_methods: normalizePaymentSettings(data.payment_methods) },
        };
    } catch (error) {
        logger.error('Error fetching settings', error);
        return { success: false, data: DEFAULT_SETTINGS, error: (error as { message?: string })?.message || 'Failed to fetch settings' };
    }
});

export async function updateStoreSettings(data: Partial<StoreSettings>): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    try {
        const { data: current } = await ctx.supabase.from('store_settings').select('id').single();

        if (!current) {
            return { success: false, error: 'Settings not initialized' };
        }

        // Whitelist editable columns; the client controls `data`.
        const { data: updated, error } = await ctx.supabase
            .from('store_settings')
            .update({
                store_name: data.store_name,
                support_email: data.support_email,
                support_phone: data.support_phone,
                currency: data.currency,
                payment_methods: data.payment_methods === undefined
                    ? undefined
                    : (normalizePaymentSettings(data.payment_methods) as Json),
                content: data.content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', current.id)
            .select('id');

        if (error) throw error;
        // RLS turns an unauthorized UPDATE into "0 rows", not an error.
        if (!updated?.length) {
            return { success: false, error: 'Settings were not saved (permission denied)' };
        }

        revalidatePath('/admin/settings');
        revalidatePath('/', 'layout'); // Update storefront too

        return { success: true };
    } catch (error) {
        logger.error('Error updating settings', error);
        return { success: false, error: (error as { message?: string })?.message ?? 'Failed to update settings' };
    }
}

export interface IntegrationStatus {
    stripe: StripeMode;
    stripeWebhook: boolean;
    emailProviders: { id: EmailProviderId; configured: boolean }[];
    sender: string;
    authEmailHook: boolean;
}

/** Which payment/email integrations have their server keys set (admin only). */
export async function getIntegrationStatus(): Promise<ActionResult<IntegrationStatus>> {
    if (!(await getAdminContext())) return { success: false, error: FORBIDDEN };
    const sender = getSender();
    return {
        success: true,
        data: {
            stripe: getStripeMode(),
            stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
            emailProviders: describeEmailProviders(),
            sender: `${sender.name} <${sender.address}>`,
            authEmailHook: !!process.env.SEND_EMAIL_HOOK_SECRET,
        },
    };
}
