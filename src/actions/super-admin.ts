'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export interface UserWithRole {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    created_at: string;
    auth_id: string;
}

export interface AuditLog {
    id: string;
    admin_id: string | null;
    action: string;
    entity: string;
    entity_id: string | null;
    details: unknown;
    created_at: string;
    admin_email?: string;
}

export interface SystemStats {
    totalUsers: number;
    totalAdmins: number;
    totalSuperAdmins: number;
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
}

/**
 * Verify current user is super_admin
 */
async function verifySuperAdmin(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || process.env['Super-Admin-Email'];
    if (user.email !== superAdminEmail) return false;

    const { data: customer } = await supabase
        .from('customers')
        .select('role')
        .eq('auth_id', user.id)
        .single();

    return customer?.role === 'super_admin';
}

/**
 * Get all users with their roles
 */
export async function getAllUsersWithRoles(): Promise<UserWithRole[]> {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        throw new Error('Unauthorized: Super admin access required');
    }

    const { data, error } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, role, created_at, auth_id')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
    }

    return (data || []).map(user => ({
        ...user,
        role: user.role || 'customer'
    })) as UserWithRole[];
}

/**
 * Update user role (promote/demote)
 */
export async function updateUserRole(
    userId: string,
    newRole: 'customer' | 'admin' | 'super_admin'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        return { success: false, error: 'Unauthorized: Super admin access required' };
    }

    // Get current user info for audit log
    const { data: { user } } = await supabase.auth.getUser();

    // Get the target customer
    const { data: targetCustomer } = await supabase
        .from('customers')
        .select('email, role')
        .eq('id', userId)
        .single();

    if (!targetCustomer) {
        return { success: false, error: 'User not found' };
    }

    // Prevent changing super_admin's own role
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || process.env['Super-Admin-Email'];
    if (targetCustomer.email === superAdminEmail && newRole !== 'super_admin') {
        return { success: false, error: 'Cannot change super admin role' };
    }

    const oldRole = targetCustomer.role;

    // Update the role
    const { error } = await supabase
        .from('customers')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        console.error('Error updating role:', error);
        return { success: false, error: 'Failed to update role' };
    }

    // Log the action
    await supabase.from('audit_logs').insert({
        admin_id: user?.id || 'unknown',
        action: 'role_change',
        entity: 'customer',
        entity_id: userId,
        details: {
            target_email: targetCustomer.email,
            old_role: oldRole,
            new_role: newRole
        }
    });

    revalidatePath('/super-admin/users');
    return { success: true };
}

/**
 * Get audit logs with optional filters
 */
export async function getAuditLogs(options?: {
    limit?: number;
    action?: string;
}): Promise<AuditLog[]> {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        throw new Error('Unauthorized: Super admin access required');
    }

    let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options?.limit || 100);

    if (options?.action) {
        query = query.eq('action', options.action);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching audit logs:', error);
        throw new Error('Failed to fetch audit logs');
    }

    return data || [];
}

/**
 * Get system-wide statistics for super admin dashboard
 */
export async function getSystemStats(): Promise<SystemStats> {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        throw new Error('Unauthorized: Super admin access required');
    }

    // Count users by role
    const { data: customers } = await supabase
        .from('customers')
        .select('role');

    const totalUsers = customers?.length || 0;
    const totalAdmins = customers?.filter(c => c.role === 'admin').length || 0;
    const totalSuperAdmins = customers?.filter(c => c.role === 'super_admin').length || 0;

    // Count orders and revenue
    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount');

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;

    // Count products
    const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    return {
        totalUsers,
        totalAdmins,
        totalSuperAdmins,
        totalOrders,
        totalRevenue,
        totalProducts: totalProducts || 0
    };
}
