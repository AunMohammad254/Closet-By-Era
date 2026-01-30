'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required', step: 'credentials' };
    }

    // STRICT: Check against .env credentials
    const envAdminEmail = process.env.ADMIN_EMAIL;
    const envAdminPassword = process.env.ADMIN_PASSWORD;

    if (email !== envAdminEmail || password !== envAdminPassword) {
        logger.warn('Admin login attempt with invalid env credentials', { email });
        return { error: 'Invalid credentials', step: 'credentials' };
    }

    const supabase = await createClient();

    // 1. Sign in with password
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        logger.error('Admin Supabase sign-in failed', signInError);
        return { error: 'Authentication failed', step: 'credentials' };
    }

    // 2. Check for MFA
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
