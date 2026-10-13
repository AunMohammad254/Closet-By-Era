/**
 * The staff accounts pinned by env (ADMIN_EMAIL, SUPER_ADMIN_EMAIL), normalized
 * the way Supabase stores emails, so every check compares like with like.
 * Plain module: the proxy imports it too.
 */

export function normalizeEmail(email: string | null | undefined): string | undefined {
    return email?.trim().toLowerCase() || undefined;
}

/** When set, only this account (or the super-admin) may use the admin panel. */
export function getAdminEmail(): string | undefined {
    return normalizeEmail(process.env.ADMIN_EMAIL);
}

/** The owner account; the super-admin panel requires both this email and the super_admin role. */
export function getSuperAdminEmail(): string | undefined {
    return normalizeEmail(process.env.SUPER_ADMIN_EMAIL || process.env['Super-Admin-Email']);
}
