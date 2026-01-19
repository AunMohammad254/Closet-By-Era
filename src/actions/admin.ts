'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/types/shared';

export async function getAdminCustomers(): Promise<ActionResult<any[]>> {
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.error('getAdminCustomers: authError', authError);
            throw new Error('Unauthorized: Auth Error');
        }
        if (!user) {
            console.error('getAdminCustomers: No user found');
            throw new Error('Unauthorized: No User');
        }

        // Optional: Check if user is admin via profiles table if needed
        // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        // if (profile?.role !== 'admin') throw new Error('Forbidden');

        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching customers:', error);
            throw new Error(error.message);
        }

        return { success: true, data };
    } catch (error: unknown) {
        console.error('Server action error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return { success: false, error: message };
    }
}
