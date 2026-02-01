'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/shared';

type StaffMember = {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: 'admin' | 'super_admin' | 'customer';
    created_at: string;
    last_login: string | null;
};

/**
 * Get all staff members (admin and super-admin roles)
 */
export async function getStaffMembers(): Promise<ActionResult<StaffMember[]>> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('customers')
            .select('id, email, first_name, last_name, role, created_at')
            .in('role', ['admin', 'super_admin'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching staff:', error);
            return { success: false, error: 'Failed to fetch staff members' };
        }

        return { success: true, data: (data as StaffMember[]) || [] };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Update a customer's role
 * Only super-admins should be able to call this
 */
export async function updateStaffRole(
    customerId: string,
    newRole: 'admin' | 'super_admin' | 'customer'
): Promise<ActionResult> {
    const supabase = await createClient();

    try {
        // Verify caller is super-admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data: caller, error: callerError } = await supabase
            .from('customers')
            .select('role')
            .eq('auth_id', user.id)
            .single();

        if (callerError || caller?.role !== 'super_admin') {
            return { success: false, error: 'Super-admin access required' };
        }

        // Prevent demoting yourself
        const { data: target } = await supabase
            .from('customers')
            .select('auth_id')
            .eq('id', customerId)
            .single();

        if (target?.auth_id === user.id && newRole !== 'super_admin') {
            return { success: false, error: 'Cannot demote yourself' };
        }

        // Update role
        const { error } = await supabase
            .from('customers')
            .update({ role: newRole })
            .eq('id', customerId);

        if (error) {
            console.error('Error updating staff role:', error);
            return { success: false, error: 'Failed to update role' };
        }

        revalidatePath('/super-admin/staff');
        return { success: true };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Search customers by email (for adding new staff)
 */
export async function searchCustomersByEmail(email: string): Promise<ActionResult<StaffMember[]>> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('customers')
            .select('id, email, first_name, last_name, role, created_at')
            .ilike('email', `%${email}%`)
            .eq('role', 'customer')
            .limit(10);

        if (error) {
            console.error('Error searching customers:', error);
            return { success: false, error: 'Failed to search customers' };
        }

        return { success: true, data: (data as StaffMember[]) || [] };
    } catch {
        return { success: false, error: 'An unexpected error occurred' };
    }
}
