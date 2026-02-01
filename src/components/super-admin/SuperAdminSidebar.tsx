'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    LayoutDashboard,
    Users,
    ScrollText,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    UserCog,
    Activity
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
    { name: 'User Management', href: '/super-admin/users', icon: Users },
    { name: 'Staff Management', href: '/super-admin/staff', icon: UserCog },
    { name: 'System Health', href: '/super-admin/health', icon: Activity },
    { name: 'Audit Logs', href: '/super-admin/audit', icon: ScrollText },
    { name: 'System Settings', href: '/super-admin/settings', icon: Settings },
];

export default function SuperAdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/super-admin/login');
    };

    const isActive = (href: string) => {
        if (href === '/super-admin') {
            return pathname === '/super-admin';
        }
        return pathname.startsWith(href);
    };

    const NavContent = () => (
        <>
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-6 border-b border-purple-500/20">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-white">Super Admin</h1>
                    <p className="text-xs text-purple-400">Owner Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'text-purple-400' : ''}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-purple-500/20">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-800 text-white shadow-lg"
            >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-purple-500/20 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    } flex flex-col`}
            >
                <NavContent />
            </aside>

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 bg-slate-900/80 backdrop-blur-xl border-r border-purple-500/20 flex-col">
                <NavContent />
            </aside>
        </>
    );
}
