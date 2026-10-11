'use server';

import type { Customer } from '@/types/database';
import { getSessionUser } from '@/lib/auth';

/** The signed-in user's customer record, or null for guests. */
export async function getCurrentCustomer(): Promise<Customer | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const { data, error } = await session.supabase
        .from('customers')
        .select('*')
        .eq('auth_id', session.user.id)
        .maybeSingle();

    if (error || !data) return null;
    return data;
}
