'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Redirect to account page if logged in
    useEffect(() => {
        if (!loading && user) {
            router.push('/account');
        }
    }, [user, loading, router]);

    // Show loading state
    if (loading) {
        return (
            <main className="min-h-screen bg-white">
                <div className="pt-32 pb-20 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-rose-600 rounded-full"></div>
                </div>
            </main>
        );
    }

    // If logged in, show loading while redirecting
    if (user) {
        return (
            <main className="min-h-screen bg-white">
                <div className="pt-32 pb-20 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-rose-600 rounded-full"></div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50/50 to-white">

            <section className="pt-32 pb-20">
                <div className="max-w-md mx-auto px-4">
                    {/* Guest Avatar */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Guest</h1>
                        <p className="text-gray-500 mt-1">Welcome to Closet By Era</p>
                    </div>

                    {/* Action Cards */}
                    <div className="space-y-4">
                        {/* Login / Register Card */}
                        <Link
                            href="/auth/login"
                            className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-rose-100 transition-all duration-200 group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                                        <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Login / Register</h3>
                                        <p className="text-sm text-gray-500">Access your account</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>

                        {/* Track Order Card */}
                        <Link
                            href="/account?tab=orders"
                            className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-rose-100 transition-all duration-200 group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Track an Order</h3>
                                        <p className="text-sm text-gray-500">Check your order status</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-gray-500">
                            Create an account to enjoy exclusive benefits, faster checkout, and order tracking.
                        </p>
                    </div>
                </div>
            </section>

        </main>
    );
}
