'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Landing page for the link sent by resetPassword() in AuthContext.
 * The browser client exchanges the recovery code in the URL for a session
 * (detectSessionInUrl), after which the user can set a new password.
 */
export default function ResetPasswordPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        const { error: updateError } = await createClient().auth.updateUser({ password });
        setIsLoading(false);

        if (updateError) {
            setError(updateError.message || 'Failed to update password');
            return;
        }

        setSuccess(true);
        setTimeout(() => router.push('/account'), 2000);
    };

    const inputClass = 'w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-gray-900 placeholder:text-gray-400';

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50/50 to-white flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            <span className="font-light">CLOSET</span>
                            <span className="text-rose-600">BY</span>
                            <span className="font-light">ERA</span>
                        </h1>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {loading ? (
                        <p className="text-center text-gray-500">Verifying your reset link…</p>
                    ) : success ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Password updated</h2>
                            <p className="text-gray-500">Redirecting you to your account…</p>
                        </div>
                    ) : !user ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Link expired</h2>
                            <p className="text-gray-500 mb-8">This password reset link is invalid or has expired.</p>
                            <Link href="/auth/forgot-password" className="text-rose-600 font-medium hover:text-rose-700 transition-colors">
                                Request a new link
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Set a new password</h2>
                            <p className="text-gray-500 text-center mb-8">for {user.email}</p>

                            {error && (
                                <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={MIN_PASSWORD_LENGTH}
                                    className={inputClass}
                                    placeholder="New password"
                                    aria-label="New password"
                                />
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={MIN_PASSWORD_LENGTH}
                                    className={inputClass}
                                    placeholder="Confirm new password"
                                    aria-label="Confirm new password"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Updating…' : 'Update password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
