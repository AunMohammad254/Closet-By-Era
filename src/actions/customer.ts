'use server';

import { createClient } from '@/lib/supabase/server';
import type { Customer } from '@/types/database';

export async function getCustomerByAuthId(authId: string): Promise<Customer | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authId)
        .single();

    if (error || !data) return null;
    return data;
}

export async function getOrCreateCustomer(authId: string, email: string, firstName?: string, lastName?: string): Promise<Customer | null> {
    // First try to get existing customer
    const existing = await getCustomerByAuthId(authId);
    if (existing) return existing;

    // Create new customer
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('customers')
        .insert({
            auth_id: authId,
            email: email,
            first_name: firstName || '',
            last_name: lastName || '',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating customer:', error);
        return null;
    }
    return data;
}
