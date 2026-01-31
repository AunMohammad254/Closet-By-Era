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

// ========== Admin Functions ==========

import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';

export interface CustomerWithLoyalty {
    id: string;
    auth_id: string;
    first_name: string;
    last_name: string;
    email: string;
    loyalty_points: number;
}

export interface CustomerLoyaltyHistory extends LoyaltyHistory {
    customer_name?: string;
}

// Admin: Get all customers with loyalty points
export async function getAllCustomersWithLoyalty(
    page: number = 1,
    pageSize: number = 20,
    search?: string
): Promise<{ customers: CustomerWithLoyalty[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
        .from('customers')
        .select('id, auth_id, first_name, last_name, email, loyalty_points', { count: 'exact' });

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: customers, count, error } = await query
        .order('loyalty_points', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
        console.error("Get Customers Loyalty Error:", error);
        return { customers: [], total: 0 };
    }

    return {
        customers: (customers || []).map(c => ({
            id: c.id,
            auth_id: c.auth_id || '',
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            email: c.email || '',
            loyalty_points: c.loyalty_points || 0
        })),
        total: count || 0
    };
}

// Admin: Adjust customer loyalty points
export async function adjustLoyaltyPoints(
    customerId: string,
    adjustment: number,
    reason: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        // Check admin role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return { success: false, error: "Admin access required" };
        }

        // Get current points
        const { data: customer } = await supabase
            .from('customers')
            .select('loyalty_points')
            .eq('id', customerId)
            .single();

        if (!customer) {
            return { success: false, error: "Customer not found" };
        }

        const currentPoints = customer.loyalty_points || 0;
        const newBalance = Math.max(0, currentPoints + adjustment);

        // Update points
        const { error: updateError } = await supabase
            .from('customers')
            .update({ loyalty_points: newBalance })
            .eq('id', customerId);

        if (updateError) {
            console.error("Update Loyalty Points Error:", updateError);
            return { success: false, error: "Failed to update points" };
        }

        // Add history entry
        await supabase
            .from('loyalty_history')
            .insert({
                customer_id: customerId,
                points: adjustment,
                reason: reason || (adjustment > 0 ? 'Admin adjustment (credit)' : 'Admin adjustment (debit)')
            });

        revalidatePath('/admin/loyalty');
        return { success: true, message: `Points ${adjustment > 0 ? 'added' : 'deducted'} successfully. New balance: ${newBalance}` };
    } catch (err) {
        console.error("Adjust Loyalty Points Exception:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

// Admin: Get loyalty history for a specific customer
export async function getCustomerLoyaltyHistory(customerId: string): Promise<LoyaltyHistory[]> {
    const supabase = await createClient();

    const { data: history, error } = await supabase
        .from('loyalty_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Get Customer Loyalty History Error:", error);
        return [];
    }

    return (history || []) as LoyaltyHistory[];
}
