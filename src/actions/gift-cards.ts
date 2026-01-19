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

    // @ts-ignore - RPC not in types yet
    const { data, error } = await supabase.rpc('validate_gift_card', {
        code_input: code
    });

    if (error) {
        console.error('Error validating gift card:', error);
        return { valid: false, message: 'System error' };
    }

    return data as ValidationResult;
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

export async function redeemGiftCard(code: string, amount: number, orderId: string): Promise<ActionResult> {
    const supabase = await getSupabase();

    // 1. Get Card (Securely)
    // We use RPC or direct query. Since we have headers/cookies, we can't trust client-provided balance.
    // We must fetch balance again.

    // Use the validation logic or direct select
    const { data: card } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code)
        .single();

    if (!card || !card.is_active) return { success: false, error: 'Invalid card' };
    if (card.balance < amount) return { success: false, error: 'Insufficient balance' };

    // 2. Deduct Bundle (Transaction would be best but simple update is okay for now)
    const newBalance = card.balance - amount;

    const { error: updateError } = await supabase
        .from('gift_cards')
        .update({ balance: newBalance })
        .eq('id', card.id);

    if (updateError) return { success: false, error: 'Failed to update balance' };

    // 3. Record Usage
    await supabase.from('gift_card_usage').insert({
        gift_card_id: card.id,
        order_id: orderId,
        amount_used: amount
    });

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
