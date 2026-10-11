import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
    buildCheckoutPaymentOptions,
    normalizePaymentSettings,
    type CheckoutPaymentOptions,
    type PaymentSettings,
} from '@/lib/payments';

const FALLBACK_SUPPORT_EMAIL = 'support@closetbyera.com';

/** Payment configuration as stored, read with the service role. */
export async function loadPaymentSettings(): Promise<{ payment: PaymentSettings; supportEmail: string }> {
    const { data, error } = await createAdminClient()
        .from('store_settings')
        .select('payment_methods, support_email')
        .limit(1)
        .maybeSingle();

    if (error) logger.error('Error loading payment settings', error);
    return {
        payment: normalizePaymentSettings(data?.payment_methods),
        supportEmail: data?.support_email || FALLBACK_SUPPORT_EMAIL,
    };
}

/** Digits-only WhatsApp number, or null when the store has not configured one. */
export function getWhatsAppNumber(): string | null {
    return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') || null;
}

/** The enabled payment methods and their public account details. */
export async function getCheckoutPaymentOptions(): Promise<CheckoutPaymentOptions> {
    const { payment, supportEmail } = await loadPaymentSettings();
    return buildCheckoutPaymentOptions(payment, { whatsappNumber: getWhatsAppNumber(), supportEmail });
}
