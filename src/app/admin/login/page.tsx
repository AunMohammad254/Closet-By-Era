'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { adminLogin, verifyAdminMfa, AdminLoginState } from '@/actions/admin-auth';

const initialState: AdminLoginState = {
    step: 'credentials',
};

export default function AdminLoginPage() {
    const [state, formAction] = useActionState(async (prev: AdminLoginState, formData: FormData) => {
        if (prev.step === 'mfa') {
            return verifyAdminMfa(prev, formData);
        }
        return adminLogin(prev, formData);
    }, initialState);

    // Keep track of code for UI only
    const [otpCode, setOtpCode] = useState('');

    return (
        <main className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block">
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            <span className="font-light">CLOSET</span>
                            <span className="text-rose-500">BY</span>
                            <span className="font-light">ERA</span>
                            <span className="ml-2 text-xs bg-rose-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">Admin</span>
                        </h1>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8">
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                        {state.step === 'mfa' ? 'Security Check' : 'Admin Access'}
                    </h2>
                    <p className="text-slate-400 text-center mb-8">
                        {state.step === 'mfa'
                            ? 'Enter the 6-digit code from your authenticator app'
                            : 'Enter your credentials to continue'}
                    </p>

                    {state.error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {state.error}
                        </div>
                    )}

                    {state.message && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {state.message}
                        </div>
                    )}

                    <form action={formAction} className="space-y-5">

                        {state.step === 'credentials' && (
                            <>
                                {/* Email Input */}
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        suppressHydrationWarning
                                        className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-white placeholder:text-slate-600"
                                        placeholder="admin@closetbyera.com"
                                    />
                                </div>

                                {/* Password Input */}
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-white placeholder:text-slate-600"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </>
                        )}

                        {state.step === 'mfa' && (
                            <div className="relative">
                                <input type="hidden" name="factorId" value={state.factorId} />
                                <input type="hidden" name="challengeId" value={state.challengeId} />

                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="code"
                                    required
                                    autoFocus
                                    maxLength={6}
                                    pattern="[0-9]*"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-white placeholder:text-slate-600 tracking-widest font-mono text-center text-xl"
                                    placeholder="000000"
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-4 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {state.step === 'mfa' ? 'Verify Code' : 'Secure Login'}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </form>
                </div>

                {/* Back to Home */}
                <div className="mt-8 text-center">
                    <Link href="/" className="text-slate-500 text-sm hover:text-slate-300 transition-colors inline-flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Store
                    </Link>
                </div>
            </div>
        </main>
    );
}
