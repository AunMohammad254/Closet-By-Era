'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAdminEmail, getSuperAdminEmail } from '@/lib/staff-emails';
import { redirect } from 'next/navigation';

export interface AdminLoginState {
    error?: string;
    message?: string;
    step?: 'credentials' | 'mfa';
    factorId?: string;
    challengeId?: string;
}

/**
 * Handle initial admin login (credentials check)
 */
export async function adminLogin(prevState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
    const rawEmail = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!rawEmail || !password) {
        return { error: 'Email and password are required', step: 'credentials' };
    }

    const email = rawEmail.trim().toLowerCase();
    const envAdminEmail = getAdminEmail();
    const envSuperAdminEmail = getSuperAdminEmail();

    // If ADMIN_EMAIL is set, pin access to that account or the super-admin
    if (envAdminEmail && email !== envAdminEmail && email !== envSuperAdminEmail) {
        logger.warn('Admin login attempt with unpinned email', { email });
        return { error: 'Invalid credentials', step: 'credentials' };
    }

    const supabase = await createClient();

    // 1. Sign in with password via Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError || !signInData.user) {
        logger.warn('Admin Supabase sign-in failed', { email, error: signInError?.message });
        return { error: 'Invalid credentials', step: 'credentials' };
    }

    // 2. Verify user has staff role (admin or super_admin) in customers table
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('role')
        .eq('auth_id', signInData.user.id)
        .maybeSingle();

    if (customerError || !customer || (customer.role !== 'admin' && customer.role !== 'super_admin')) {
        logger.warn('Admin login attempt by non-staff user', { email, role: customer?.role });
        await supabase.auth.signOut();
        return { error: 'Invalid credentials', step: 'credentials' };
    }

    // 3. Check for MFA
    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (mfaError) {
        logger.error('Failed to check MFA status', mfaError);
        return { error: 'Failed to verify security settings', step: 'credentials' };
    }

    if (mfaData.nextLevel === 'aal2' && mfaData.nextLevel !== mfaData.currentLevel) {
        // MFA is enrolled but not yet verified for this session
        // We need to trigger the MFA challenge
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (factorsError || !factors.all || factors.all.length === 0) {
            logger.error('MFA required but no factors found', factorsError);
            return { error: 'MFA configuration error', step: 'credentials' };
        }

        const totpFactor = factors.all.find(f => f.factor_type === 'totp' && f.status === 'verified');

        if (!totpFactor) {
            // Should not happen if nextLevel is aal2, but handle gracefully
            return { error: 'No verified TOTP factor found', step: 'credentials' };
        }

        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: totpFactor.id
        });

        if (challengeError) {
            logger.error('Failed to create MFA challenge', challengeError);
            return { error: 'Failed to initiate MFA', step: 'credentials' };
        }

        return {
            step: 'mfa',
            factorId: totpFactor.id,
            challengeId: challengeData.id,
            message: 'Please enter your 6-digit authenticator code.'
        };
    }

    // If MFA is not set up, or already verified (unlikely on fresh login), checking if we should force setup
    // For now, if no MFA is enrolled, we proceed (or we could redirect to setup)
    // The requirement says: "entering specific code... will allow to enter"
    // We will enforce MFA check in middleware/guard.

    // Redirect to dashboard if no MFA required (or if we want to force setup, we handle that in middleware)
    redirect('/admin');
}

/**
 * Verify MFA code
 */
export async function verifyAdminMfa(prevState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
    const code = formData.get('code') as string;
    const factorId = formData.get('factorId') as string;
    const challengeId = formData.get('challengeId') as string;

    if (!code || !factorId || !challengeId) {
        return { error: 'Invalid request', step: 'mfa', factorId, challengeId };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
    });

    if (error) {
        logger.warn('Admin MFA verification failed', { error: error.message });
        return { error: 'Invalid code. Please try again.', step: 'mfa', factorId, challengeId };
    }

    // Success!
    redirect('/admin');
}
