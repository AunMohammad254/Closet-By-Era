import 'server-only';

import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export type StaffRole = 'admin' | 'super_admin';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface StaffContext {
    supabase: ServerClient;
    user: User;
    customerId: string;
    role: StaffRole;
}

function isStaffRole(role: string | null | undefined): role is StaffRole {
    return role === 'admin' || role === 'super_admin';
}

/**
 * Resolves the signed-in user's staff role from `customers.role`.
 * Returns null when there is no verified session or the user is not staff.
 *
 * Every admin server action must call this (or getSuperAdminContext) before
 * touching data: server actions are public HTTP endpoints, so RLS alone is
 * not a sufficient guard.
 */
export async function getAdminContext(): Promise<StaffContext | null> {
    const session = await getSessionUser();
    return session ? getStaffContext(session) : null;
}

/**
 * The staff context for a session that getSessionUser() already verified, so
 * code that needs both does not ask Supabase Auth for the user twice.
 */
export async function getStaffContext({ supabase, user }: { supabase: ServerClient; user: User }): Promise<StaffContext | null> {
    const { data: customer } = await supabase
        .from('customers')
        .select('id, role')
        .eq('auth_id', user.id)
        .maybeSingle();

    if (!customer || !isStaffRole(customer.role)) return null;

    return { supabase, user, customerId: customer.id, role: customer.role };
}

export async function getSuperAdminContext(): Promise<StaffContext | null> {
    const ctx = await getAdminContext();
    return ctx?.role === 'super_admin' ? ctx : null;
}

/** Signed-in shopper (any role). Returns null for guests. */
export async function getSessionUser(): Promise<{ supabase: ServerClient; user: User } | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { supabase, user } : null;
}

export const FORBIDDEN = 'Forbidden: admin access required';
