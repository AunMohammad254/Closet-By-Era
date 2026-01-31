'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    FolderTree,
    ShoppingCart,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Ticket,
    Gift,
    MessageCircle,
    Star,
    Coins,
    BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { name: 'Gift Cards', href: '/admin/gift-cards', icon: Gift },
    { name: 'Reviews', href: '/admin/reviews', icon: Star },
    { name: 'Loyalty', href: '/admin/loyalty', icon: Coins },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/users', icon: Users },
    { name: 'Support Chat', href: '/admin/chat', icon: MessageCircle },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1e293b] shadow-lg text-slate-300 hover:text-white transition-colors"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-40 h-screen w-64 bg-[#1e293b] border-r border-slate-700/50 transition-transform duration-300 ease-in-out
                lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
                        <span className="text-xl font-bold bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">
                            Closet By Era
                        </span>
                        <span className="ml-2 text-[10px] font-semibold text-rose-400 border border-rose-500/30 bg-rose-500/10 rounded px-1.5 py-0.5">
                            ADMIN
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/admin' && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-rose-500/10 text-rose-400 shadow-lg shadow-rose-500/5'
                                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                        }
                                    `}
                                >
                                    <Icon size={20} className={`mr-3 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                                    {item.name}
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-rose-400 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-3 border-t border-slate-700/50">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200"
                        >
                            <LogOut size={20} className="mr-3" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
