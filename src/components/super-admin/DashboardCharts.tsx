'use client';

import { Users, ShieldCheck, Shield, ShoppingCart, DollarSign, Package, LucideIcon } from 'lucide-react';

interface StatCard {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    shadowColor: string;
}

interface DashboardChartsProps {
    stats: {
        totalUsers: number;
        totalAdmins: number;
        totalSuperAdmins: number;
        totalOrders: number;
        totalRevenue: number;
        totalProducts: number;
    };
    analytics: {
        revenueData: { date: string; amount: number }[];
        growthData: { date: string; count: number }[];
    };
}

export default function DashboardCharts({ stats, analytics }: DashboardChartsProps) {
    const statCards: StatCard[] = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            shadowColor: 'shadow-blue-500/25'
        },
        {
            title: 'Admins',
            value: stats.totalAdmins,
            icon: ShieldCheck,
            color: 'from-green-500 to-emerald-500',
            shadowColor: 'shadow-green-500/25'
        },
        {
            title: 'Super Admins',
            value: stats.totalSuperAdmins,
            icon: Shield,
            color: 'from-purple-500 to-pink-500',
            shadowColor: 'shadow-purple-500/25'
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingCart,
            color: 'from-orange-500 to-amber-500',
            shadowColor: 'shadow-orange-500/25'
        },
        {
            title: 'Total Revenue',
            value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'from-emerald-500 to-teal-500',
            shadowColor: 'shadow-emerald-500/25'
        },
        {
            title: 'Total Products',
            value: stats.totalProducts,
            icon: Package,
            color: 'from-violet-500 to-purple-500',
            shadowColor: 'shadow-violet-500/25'
        }
    ];

    const maxRevenue = Math.max(...(analytics.revenueData.map(d => d.amount) || [0]));
    const maxUsers = Math.max(...(analytics.growthData.map(d => d.count) || [0]));

    return (
        <>
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
                        {analytics.revenueData.map((d) => (
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
                        {analytics.growthData.map((d) => (
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
        </>
    );
}
