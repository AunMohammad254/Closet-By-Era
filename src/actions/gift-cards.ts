'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { ActionResult } from '@/types/shared';
import type { Database } from '@/types/supabase';

// Helper to get typed client
const getSupabase = async () => await createClient();

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
    const supabase = await getSupabase();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: customer } = await supabase
        .from('customers')
        .select('role')
        .eq('auth_id', user.id)
        .single();

    if (customer?.role !== 'admin') return [];

    const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching gift cards:', error);
        return [];
    }

    return data as GiftCard[];
}


export async function createGiftCard(data: {
    code?: string;
    initial_value: number;
    expires_at?: string;
}): Promise<ActionResult> {
    const supabase = await getSupabase();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: customer } = await supabase
        .from('customers')
        .select('role')
        .eq('auth_id', user.id)
        .single();

    if (customer?.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const code = data.code || generateCode();

    const { error } = await supabase
        .from('gift_cards')
        .insert({
            code,
            initial_value: data.initial_value,
            balance: data.initial_value,
            expires_at: data.expires_at || null,
        });

    if (error) {
        console.error('Error creating gift card:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/gift-cards');
    return { success: true };
}

export async function validateGiftCard(code: string): Promise<ValidationResult> {
    const supabase = await getSupabase();

    const { data, error } = await supabase.rpc('validate_gift_card', {
        code_input: code
    });

    if (error) {
        console.error('Error validating gift card:', error);
        return { valid: false, message: 'System error' };
    }

    return data as unknown as ValidationResult;
}

export async function deactivateGiftCard(id: string): Promise<ActionResult> {
    const supabase = await getSupabase();

    // Check admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const { data: customer } = await supabase
        .from('customers')
        .select('role')
        .eq('auth_id', user.id)
        .single();

    if (customer?.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('gift_cards')
        .update({ is_active: false })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/gift-cards');
    return { success: true };
}

/**
 * Redeems a gift card for an order.
 * Uses atomic UPDATE with balance check to prevent race conditions (TOCTOU).
 * The WHERE clause ensures balance >= amount before updating.
 */
export async function redeemGiftCard(code: string, amount: number, orderId: string): Promise<ActionResult> {
    const supabase = await getSupabase();

    if (amount <= 0) {
        return { success: false, error: 'Invalid redemption amount' };
    }

    // Atomic update: only succeeds if card exists, is active, not expired, and has sufficient balance
    // This prevents race conditions by combining check and update in a single atomic operation
    const { data: updatedCards, error: updateError } = await supabase
        .from('gift_cards')
        .update({ 
            balance: supabase.rpc ? undefined : 0 // Placeholder, actual update below
        })
        .eq('code', code)
        .eq('is_active', true)
        .gte('balance', amount)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .select('id, balance');

    // Use raw SQL via RPC for atomic balance deduction
    // This is the safest approach to prevent race conditions
    const { data: result, error: rpcError } = await supabase.rpc('redeem_gift_card_atomic', {
        p_code: code,
        p_amount: amount,
        p_order_id: orderId
    });

    // If RPC doesn't exist, fall back to optimistic locking approach
    if (rpcError?.code === 'PGRST202' || rpcError?.message?.includes('function')) {
        // Fallback: Use optimistic concurrency control
        // First, get the card with its current balance
        const { data: card, error: fetchError } = await supabase
            .from('gift_cards')
            .select('id, balance, is_active, expires_at')
            .eq('code', code)
            .single();

        if (fetchError || !card) {
            return { success: false, error: 'Gift card not found' };
        }

        if (!card.is_active) {
            return { success: false, error: 'Gift card is inactive' };
        }

        if (card.expires_at && new Date(card.expires_at) < new Date()) {
            return { success: false, error: 'Gift card has expired' };
        }

        if (card.balance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }

        // Atomic update with balance check in WHERE clause
        // This ensures another concurrent request can't drain the balance
        const newBalance = card.balance - amount;
        const { data: updated, error: atomicError, count } = await supabase
            .from('gift_cards')
            .update({ balance: newBalance })
            .eq('id', card.id)
            .eq('balance', card.balance) // Optimistic lock: only update if balance hasn't changed
            .select('id');

        if (atomicError || !updated || updated.length === 0) {
            // Balance changed between read and write - concurrent modification detected
            return { success: false, error: 'Gift card balance was modified. Please try again.' };
        }

        // Record usage
        const { error: usageError } = await supabase.from('gift_card_usage').insert({
            gift_card_id: card.id,
            order_id: orderId,
            amount_used: amount
        });

        if (usageError) {
            console.error('Failed to record gift card usage:', usageError);
            // Usage logging failure shouldn't fail the redemption
        }

        return { success: true };
    }

    if (rpcError) {
        console.error('Gift card redemption error:', rpcError);
        return { success: false, error: 'Failed to redeem gift card' };
    }

    if (!result?.success) {
        return { success: false, error: result?.message || 'Failed to redeem gift card' };
    }

    return { success: true };
}

function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
