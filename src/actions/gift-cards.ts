'use server';

import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { GiftCardFormSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import { getAdminContext, getSessionUser, FORBIDDEN } from '@/lib/auth';
import { getClientIp } from '@/lib/request';

import { ActionResult } from '@/types/shared';

export type GiftCard = {
    id: string;
    code: string;
    balance: number;
    initial_value: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
};

export type ValidationResult = {
    valid: boolean;
    message?: string;
    id?: string;
    code?: string;
    balance?: number;
    initial_value?: number;
};

export async function getGiftCards() {
    const ctx = await getAdminContext();
    if (!ctx) return [];

    const { data, error } = await ctx.supabase
        .from('gift_cards')
        .select('id, code, balance, initial_value, is_active, expires_at, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Error fetching gift cards', error, { action: 'getGiftCards' });
        return [];
    }

    return data as GiftCard[];
}


export async function createGiftCard(data: {
    code?: string;
    initial_value: number;
    expires_at?: string;
}): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const rateCheck = await checkRateLimit(ctx.user.id, 'createGiftCard', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    // Validate input with Zod
    const validation = GiftCardFormSchema.safeParse(data);
    if (!validation.success) {
        const errorMessage = validation.error.issues.map(e => e.message).join(', ');
        logger.warn('Gift card validation failed', { action: 'createGiftCard', errors: errorMessage });
        return { success: false, error: errorMessage };
    }

    const validData = validation.data;
    const code = validData.code?.trim().toUpperCase() || generateCode();

    const { error } = await ctx.supabase
        .from('gift_cards')
        .insert({
            code,
            initial_value: validData.initial_value,
            balance: validData.initial_value,
            expires_at: validData.expires_at || null,
        });

    if (error) {
        logger.error('Error creating gift card', error, { action: 'createGiftCard' });
        return { success: false, error: error.code === '23505' ? 'Gift card code already exists' : 'Failed to create gift card' };
    }

    revalidatePath('/dashboard/gift-cards');
    revalidatePath('/admin/gift-cards');
    return { success: true };
}

/**
 * Checks a gift card for the checkout preview. Redemption happens only inside
 * createOrder, so this never changes a balance.
 */
export async function validateGiftCard(code: string): Promise<ValidationResult> {
    const session = await getSessionUser();
    const rateKey = session ? `user-${session.user.id}` : `ip-${await getClientIp()}`;
    const rateCheck = await checkRateLimit(rateKey, 'validate-code', { limit: 10, windowSeconds: 300 });
    if (!rateCheck.allowed) {
        return { valid: false, message: `Too many attempts. Try again in ${rateCheck.resetIn}s` };
    }

    const { data, error } = await createAdminClient().rpc('validate_gift_card', {
        code_input: code.trim().toUpperCase()
    });

    if (error) {
        logger.error('Error validating gift card', error, { action: 'validateGiftCard' });
        return { valid: false, message: 'System error' };
    }

    return data as unknown as ValidationResult;
}

export async function deactivateGiftCard(id: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const rateCheck = await checkRateLimit(ctx.user.id, 'deactivateGiftCard', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    const { error } = await ctx.supabase
        .from('gift_cards')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        logger.error('Error deactivating gift card', error, { action: 'deactivateGiftCard', giftCardId: id });
        return { success: false, error: 'Failed to deactivate gift card' };
    }

    revalidatePath('/dashboard/gift-cards');
    revalidatePath('/admin/gift-cards');
    return { success: true };
}

/** 12 random chars from a CSPRNG, e.g. "K7QD-9XWA-M2PE". Math.random is guessable. */
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars[randomInt(chars.length)];
    }
    return code;
}
