'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSystemStats, getAnalyticsData, type SystemStats } from '@/actions/super-admin';
import { Users, ShieldCheck, Shield, ShoppingCart, DollarSign, Package, TrendingUp, Loader2 } from 'lucide-react';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [analytics, setAnalytics] = useState<{ revenueData: { date: string, amount: number }[], growthData: { date: string, count: number }[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const [statsData, analyticsData] = await Promise.all([
                    getSystemStats(),
                    getAnalyticsData()
                ]);
                setStats(statsData);
                setAnalytics(analyticsData);
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

    const maxRevenue = Math.max(...(analytics?.revenueData.map(d => d.amount) || [0]));
    const maxUsers = Math.max(...(analytics?.growthData.map(d => d.count) || [0]));

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

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Revenue Trend (30 Days)</h3>
                    <div className="h-64 flex items-end gap-1">
                        {analytics?.revenueData.map((d) => (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div
                                    className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 rounded-t transition-all duration-300 relative group-hover:scale-y-105 origin-bottom"
                                    style={{ height: `${maxRevenue ? (d.amount / maxRevenue) * 100 : 0}%`, minHeight: '4px' }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        <p>{d.date}</p>
                                        <p className="font-bold">Rs. {d.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Growth Chart */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">User Signups (30 Days)</h3>
                    <div className="h-64 flex items-end gap-1">
                        {analytics?.growthData.map((d) => (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div
                                    className="w-full bg-blue-500/20 hover:bg-blue-500/40 rounded-t transition-all duration-300 relative group-hover:scale-y-105 origin-bottom"
                                    style={{ height: `${maxUsers ? (d.count / maxUsers) * 100 : 0}%`, minHeight: '4px' }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        <p>{d.date}</p>
                                        <p className="font-bold">{d.count} Users</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/super-admin/users"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Manage User Roles</span>
                    </Link>
                    <Link
                        href="/super-admin/audit"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <Shield className="w-5 h-5 text-purple-400" />
                        <span className="text-white">View Audit Logs</span>
                    </Link>
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors border border-slate-700/50"
                    >
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <span className="text-white">Go to Admin Panel</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
