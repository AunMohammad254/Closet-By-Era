'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createClient } from '@/lib/supabase/client';

export default function AdminHeader() {
    const router = useRouter();
    const { adminUser, isLoading } = useAdminAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    // Get user initials for avatar
    const getInitials = () => {
        if (!adminUser?.customer) return 'A';
        const first = adminUser.customer.first_name?.[0] || '';
        const last = adminUser.customer.last_name?.[0] || '';
        return (first + last).toUpperCase() || adminUser.customer.email[0].toUpperCase();
    };

    const getDisplayName = () => {
        if (!adminUser?.customer) return 'Admin';
        if (adminUser.customer.first_name) {
            return `${adminUser.customer.first_name}${adminUser.customer.last_name ? ' ' + adminUser.customer.last_name : ''}`;
        }
        return adminUser.customer.email.split('@')[0];
    };

    return (
        <header className="h-16 bg-[#1e293b] border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Search */}
            <div className="flex items-center max-w-md w-full">
                <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search size={18} className="text-slate-500" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 text-sm text-slate-200 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:bg-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#1e293b]"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative pl-4 border-l border-slate-700/50" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center space-x-3 hover:bg-slate-700/50 rounded-xl px-3 py-1.5 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-rose-500/20">
                            {isLoading ? '...' : getInitials()}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium text-slate-200">
                                {isLoading ? 'Loading...' : getDisplayName()}
                            </p>
                            <p className="text-xs text-slate-500">
                                {adminUser?.customer?.role === 'admin' ? 'Administrator' : 'User'}
                            </p>
                        </div>
                        <ChevronDown size={16} className="text-slate-500" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-[#1e293b] rounded-xl shadow-2xl border border-slate-700/50 py-1 z-50">
                            <div className="px-4 py-3 border-b border-slate-700/50">
                                <p className="text-sm font-medium text-slate-200">{getDisplayName()}</p>
                                <p className="text-xs text-slate-500 truncate">{adminUser?.customer?.email}</p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    router.push('/account');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 transition-colors"
                            >
                                <User size={16} />
                                View Profile
                            </button>

                            <div className="border-t border-slate-700/50 mt-1 pt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
