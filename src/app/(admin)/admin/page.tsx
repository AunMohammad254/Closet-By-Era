'use client';

import { DollarSign, ShoppingBag, Package, Users } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import RecentOrdersTable from '@/components/admin/RecentOrdersTable';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const salesData = [
    { name: 'Jan', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 5000 },
    { name: 'Apr', sales: 4500 },
    { name: 'May', sales: 6000 },
    { name: 'Jun', sales: 5500 },
    { name: 'Jul', sales: 7000 },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Overview of your store's performance.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Revenue"
                    value="$52,400"
                    icon={DollarSign}
                    trend="+12%"
                    trendUp={true}
                />
                <StatsCard
                    title="Active Orders"
                    value="142"
                    icon={ShoppingBag}
                    trend="+5%"
                    trendUp={true}
                />
                <StatsCard
                    title="Total Products"
                    value="1,200"
                    icon={Package}
                />
                <StatsCard
                    title="New Customers"
                    value="25"
                    icon={Users}
                    trend="-2%"
                    trendUp={false}
                />
            </div>

            {/* Charts & Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-6">Sales Overview</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={salesData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E11D48" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(value: any) => [`$${value}`, 'Sales']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#E11D48"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Orders (Partial View or Different Widget) */}
                {/* In this layout, we might put Recent Orders below or to the side. 
                    Let's put it full width below for now as per mockup imagination, 
                    or side by side if we had a smaller widget. 
                    The plan said "Below the cards is a large line graph... A table of recent orders is visible at the bottom."
                    So I'll put the chart full width or 2/3 and maybe something else on the side, 
                    but simpler: Chart then Table.
                */}
            </div>

            {/* Recent Orders Section */}
            <div>
                <RecentOrdersTable />
            </div>
        </div>
    );
}
