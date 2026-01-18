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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Search */}
            <div className="flex items-center max-w-md w-full">
                <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search size={18} className="text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-rose-300 transition-colors"
                    />
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative pl-4 border-l border-gray-200" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-medium text-sm">
                            {isLoading ? '...' : getInitials()}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium text-gray-900">
                                {isLoading ? 'Loading...' : getDisplayName()}
                            </p>
                            <p className="text-xs text-gray-500">
                                {adminUser?.customer?.role === 'admin' ? 'Administrator' : 'User'}
                            </p>
                        </div>
                        <ChevronDown size={16} className="text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                                <p className="text-xs text-gray-500 truncate">{adminUser?.customer?.email}</p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    router.push('/account');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <User size={16} />
                                View Profile
                            </button>

                            <div className="border-t border-gray-100 mt-1 pt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
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
