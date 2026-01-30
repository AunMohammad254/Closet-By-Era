'use client';

import Link from 'next/link';
import { Plus, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';

export default function QuickActions() {
    const actions = [
        {
            label: 'Add Product',
            href: '/admin/products/new',
            icon: Plus,
            color: 'bg-rose-500',
            textColor: 'text-white'
        },
        {
            label: 'Pending Orders',
            href: '/admin/orders?status=Pending',
            icon: ShoppingBag,
            color: 'bg-indigo-500/10',
            textColor: 'text-indigo-400'
        },
        {
            label: 'View Customers',
            href: '/admin/users',
            icon: Users,
            color: 'bg-emerald-500/10',
            textColor: 'text-emerald-400'
        },
        {
            label: 'Manage Categories',
            href: '/admin/categories',
            icon: Package,
            color: 'bg-amber-500/10',
            textColor: 'text-amber-400'
        }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {actions.map((action) => {
                const Icon = action.icon;
                return (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#1e293b] border border-slate-700/50 hover:bg-slate-800 transition-all hover:scale-105 duration-200 group shadow-sm hover:shadow-lg hover:shadow-rose-500/5"
                    >
                        <div className={`p-3 rounded-xl mb-3 ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`w-6 h-6 ${action.textColor || 'text-white'}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors text-center">
                            {action.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
