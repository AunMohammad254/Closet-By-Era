'use server';

import { createClient } from '@/lib/supabase/server';

// Type-safe wrapper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSupabaseAny = async () => await createClient() as any;

export interface LoyaltyHistory {
    id: string;
    points: number;
    reason: string;
    created_at: string;
}

export async function getLoyaltyBalance() {
    const supabase = await getSupabaseAny();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { data: profile } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user.id)
        .single();

    return profile?.loyalty_points || 0;
}

export async function getLoyaltyHistory() {
    const supabase = await getSupabaseAny();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: history } = await supabase
        .from('loyalty_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return history as LoyaltyHistory[] || [];
}

export async function awardLoyaltyPoints(total: number) {
    const supabase = await getSupabaseAny();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const pointsEarned = Math.floor(total / 100);
    if (pointsEarned <= 0) return;

    // 1. Get current points
    const { data: profile } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user.id)
        .single();

    const currentPoints = profile?.loyalty_points || 0;
    const newBalance = currentPoints + pointsEarned;

    // 2. Update profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ loyalty_points: newBalance })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating loyalty points:', updateError);
        return;
    }

    // 3. Add history entry
    await supabase
        .from('loyalty_history')
        .insert({
            user_id: user.id,
            points: pointsEarned,
            reason: `Earned from purchase (Order)` // Ideally we'd link the Order ID, but for now generic is fine or we pass Order ID
        });
}
