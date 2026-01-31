'use client';

import { useState, useEffect } from 'react';
import { getSystemStats, type SystemStats } from '@/actions/super-admin';
import { Users, ShieldCheck, Shield, ShoppingCart, DollarSign, Package, TrendingUp, Loader2 } from 'lucide-react';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await getSystemStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to load stats:', error);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            shadowColor: 'shadow-blue-500/25'
        },
        {
            title: 'Admins',
            value: stats?.totalAdmins || 0,
            icon: ShieldCheck,
            color: 'from-green-500 to-emerald-500',
            shadowColor: 'shadow-green-500/25'
        },
        {
            title: 'Super Admins',
            value: stats?.totalSuperAdmins || 0,
            icon: Shield,
            color: 'from-purple-500 to-pink-500',
            shadowColor: 'shadow-purple-500/25'
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            color: 'from-orange-500 to-amber-500',
            shadowColor: 'shadow-orange-500/25'
        },
        {
            title: 'Total Revenue',
            value: `Rs. ${(stats?.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'from-emerald-500 to-teal-500',
            shadowColor: 'shadow-emerald-500/25'
        },
        {
            title: 'Total Products',
            value: stats?.totalProducts || 0,
            icon: Package,
            color: 'from-violet-500 to-purple-500',
            shadowColor: 'shadow-violet-500/25'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
                    <p className="text-slate-400 mt-1">System overview and management</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">Owner Access</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.title}
                            className={`bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl ${card.shadowColor} transition-transform duration-200 hover:scale-[1.02]`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">{card.title}</p>
                            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/super-admin/users"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Manage User Roles</span>
                    </a>
                    <a
                        href="/super-admin/audit"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <Shield className="w-5 h-5 text-purple-400" />
                        <span className="text-white">View Audit Logs</span>
                    </a>
                    <a
                        href="/admin"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <span className="text-white">Go to Admin Panel</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
