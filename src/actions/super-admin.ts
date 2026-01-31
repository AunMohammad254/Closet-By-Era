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
 * Get users with pagination
 */
export async function getAllUsersWithRoles(options?: {
    offset?: number;
    limit?: number;
}): Promise<{ users: UserWithRole[]; total: number }> {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        throw new Error('Unauthorized: Super admin access required');
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    // Get total count
    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

    // Get paginated data
    const { data, error } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, role, created_at, auth_id')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
    }

    const users = (data || []).map(user => ({
        ...user,
        role: user.role || 'customer'
    })) as UserWithRole[];

    return { users, total: count || 0 };
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
    startDate?: string;
    endDate?: string;
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

    if (options?.startDate) {
        query = query.gte('created_at', options.startDate);
    }

    if (options?.endDate) {
        query = query.lte('created_at', options.endDate);
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

    // Efficient count queries - don't fetch all data
    const [customersResult, adminsResult, superAdminsResult, ordersResult, productsResult] = await Promise.all([
        // Total users count
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        // Admins count
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        // Super admins count
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('role', 'super_admin'),
        // Orders with revenue - only fetch what we need
        supabase.from('orders').select('total_amount'),
        // Products count
        supabase.from('products').select('*', { count: 'exact', head: true })
    ]);

    const totalOrders = ordersResult.data?.length || 0;
    const totalRevenue = ordersResult.data?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;

    return {
        totalUsers: customersResult.count || 0,
        totalAdmins: adminsResult.count || 0,
        totalSuperAdmins: superAdminsResult.count || 0,
        totalOrders,
        totalRevenue,
        totalProducts: productsResult.count || 0
    };
}

/**
 * Export all users to CSV
 */
export async function exportUsersCSV(): Promise<string> {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        throw new Error('Unauthorized: Super admin access required');
    }

    const { data } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, role, created_at')
        .order('created_at', { ascending: false });

    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Created At'];
    const rows = (data || []).map(u => [
        u.id,
        u.email,
        u.first_name || '',
        u.last_name || '',
        u.role || 'customer',
        new Date(u.created_at || new Date()).toISOString()
    ]);

    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}

/**
 * Get user activity (orders and logs)
 */
export async function getUserActivity(userId: string) {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        throw new Error('Unauthorized: Super admin access required');
    }

    // Parallel fetch
    const [ordersResult, logsResult] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status, created_at, items').eq('customer_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('audit_logs').select('*').or(`entity_id.eq.${userId},admin_id.eq.${userId}`).order('created_at', { ascending: false }).limit(20)
    ]);

    return {
        orders: ordersResult.data || [],
        logs: logsResult.data || []
    };
}

/**
 * Get analytics data (last 30 days)
 */
export async function getAnalyticsData() {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        throw new Error('Unauthorized: Super admin access required');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString();

    const [ordersResult, usersResult] = await Promise.all([
        supabase.from('orders').select('total_amount, created_at').gte('created_at', startDate).order('created_at', { ascending: true }),
        supabase.from('customers').select('created_at').gte('created_at', startDate).order('created_at', { ascending: true })
    ]);

    const orders = ordersResult.data || [];
    const users = usersResult.data || [];

    // Group by date
    const revenueByDate: Record<string, number> = {};
    const usersByDate: Record<string, number> = {};

    // Initialize last 30 days with 0
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        revenueByDate[dateStr] = 0;
        usersByDate[dateStr] = 0;
    }

    orders.forEach(o => {
        const dateStr = new Date(o.created_at || new Date().toISOString()).toISOString().split('T')[0];
        if (revenueByDate[dateStr] !== undefined) {
            revenueByDate[dateStr] += Number(o.total_amount) || 0;
        }
    });



    users.forEach(u => {
        const dateStr = new Date(u.created_at || new Date().toISOString()).toISOString().split('T')[0];
        if (usersByDate[dateStr] !== undefined) {
            usersByDate[dateStr] += 1;
        }
    });

    // Convert to sorted array
    const revenueData = Object.entries(revenueByDate)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, amount]) => ({ date, amount }));

    const growthData = Object.entries(usersByDate)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

    return { revenueData, growthData };
}

/**
 * Bulk update user roles
 */
export async function bulkUpdateUserRoles(
    userIds: string[],
    newRole: 'customer' | 'admin' | 'super_admin'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        return { success: false, error: 'Unauthorized: Super admin access required' };
    }

    if (userIds.length === 0) return { success: true };

    // Get current user info for audit log
    const { data: { user } } = await supabase.auth.getUser();

    // Prevent changing super_admin's own role
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || process.env['Super-Admin-Email'];
    const { data: targets } = await supabase.from('customers').select('id, email, role').in('id', userIds);

    const safeUserIds = targets?.filter(t => t.email !== superAdminEmail).map(t => t.id) || [];

    if (safeUserIds.length === 0) {
        return { success: false, error: 'No valid users to update' };
    }

    const { error } = await supabase
        .from('customers')
        .update({ role: newRole })
        .in('id', safeUserIds);

    if (error) {
        console.error('Error bulk updating roles:', error);
        return { success: false, error: 'Failed to bulk update roles' };
    }

    // Log the action (one log for the batch)
    await supabase.from('audit_logs').insert({
        admin_id: user?.id || 'unknown',
        action: 'bulk_role_change',
        entity: 'customer',
        entity_id: null,
        details: {
            count: safeUserIds.length,
            ids: safeUserIds,
            new_role: newRole
        }
    });

    revalidatePath('/super-admin/users');
    return { success: true };
}

/**
 * Record a login event
 */
export async function recordLogin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
        // Dynamic import to avoid build issues if mixed with strict static gen
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        await supabase.from('login_history' as any).insert({
            user_id: user.id,
            ip_address: ip,
            user_agent: userAgent
        });
    } catch (error) {
        console.error('Failed to record login:', error);
        // Don't throw, just log - login should not fail because tracing failed
    }
}

/**
 * Get login history for a user
 */
export async function getLoginHistory(userId: string) {
    const supabase = await createClient();

    if (!await verifySuperAdmin()) {
        throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
        .from('login_history' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching login history:', error);
        return [];
    }

    return data;
}
