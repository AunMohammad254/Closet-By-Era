'use server';

import { createClient } from '@/lib/supabase/server';

export interface LoyaltyHistory {
    id: string;
    points: number;
    reason: string;
    created_at: string;
}

export async function getLoyaltyBalance() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { data: customer } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('auth_id', user.id)
        .single();

    return customer?.loyalty_points || 0;
}

export async function getLoyaltyHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // First get the customer record to get their ID
    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!customer) return [];

    const { data: history } = await supabase
        .from('loyalty_history')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

    return (history as LoyaltyHistory[]) || [];
}

export async function awardLoyaltyPoints(total: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const pointsEarned = Math.floor(total / 100);
    if (pointsEarned <= 0) return;

    // 1. Get current customer record with points
    const { data: customer } = await supabase
        .from('customers')
        .select('id, loyalty_points')
        .eq('auth_id', user.id)
        .single();

    if (!customer) {
        console.error('Error: Customer record not found for user', user.id);
        return;
    }

    const currentPoints = customer.loyalty_points || 0;
    const newBalance = currentPoints + pointsEarned;

    // 2. Update customer loyalty points
    const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: newBalance })
        .eq('id', customer.id);

    if (updateError) {
        console.error('Error updating loyalty points:', updateError);
        return;
    }

    // 3. Add history entry
    await supabase
        .from('loyalty_history')
        .insert({
            customer_id: customer.id,
            points: pointsEarned,
            reason: `Earned from purchase (Order)`
        });
}
