'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getSalesByCategory,
    getRevenueTrend,
    getOrdersExportData,
    type CategorySale,
    type RevenueTrend
} from '@/actions/analytics';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    Calendar, ChevronDown, Download, Loader2, RefreshCw,
    TrendingUp, BarChart3, PieChartIcon, DollarSign, Package
} from 'lucide-react';

const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'];

export default function AnalyticsPage() {
    const [categorySales, setCategorySales] = useState<CategorySale[]>([]);
    const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [catSales, trend] = await Promise.all([
            getSalesByCategory(days),
            getRevenueTrend(days)
        ]);
        setCategorySales(catSales);
        setRevenueTrend(trend);
        setLoading(false);
    }, [days]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExport = async () => {
        setExporting(true);
        const csvData = await getOrdersExportData(days);

        // Download CSV
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_report_${days}days_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExporting(false);
    };

    const ranges = [
        { label: 'Last 7 Days', value: 7 },
        { label: 'Last 30 Days', value: 30 },
        { label: 'Last 90 Days', value: 90 },
        { label: 'Last Year', value: 365 },
    ];

    const totalRevenue = revenueTrend.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = revenueTrend.reduce((sum, d) => sum + d.order_count, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
                    <p className="text-slate-400 text-sm mt-1">Detailed sales reports and performance metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Range Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            <span>{ranges.find(r => r.value === days)?.label}</span>
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                        </button>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-40 bg-[#1e293b] border border-slate-700/50 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                    {ranges.map((range) => (
                                        <button
                                            key={range.value}
                                            onClick={() => { setDays(range.value); setIsDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${days === range.value
                                                ? 'bg-rose-500/10 text-rose-400 font-medium'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Export CSV
                    </button>
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-700 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-6 rounded-2xl border border-rose-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-rose-500/20 rounded-xl">
                            <DollarSign className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-400">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">Rs. {totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-400">Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">{totalOrders.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6 rounded-2xl border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-amber-500/20 rounded-xl">
                            <BarChart3 className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-400">Avg. Order Value</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">
                        Rs. {totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 p-6 rounded-2xl border border-violet-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-violet-500/20 rounded-xl">
                            <Package className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-400">Categories</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">{categorySales.length}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                        <span className="w-1 h-5 bg-rose-400 rounded-full"></span>
                        Revenue Trend
                    </h3>
                    <div className="h-72 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                            </div>
                        ) : revenueTrend.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                No data available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#f43f5e" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Sales by Category */}
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                        <span className="w-1 h-5 bg-rose-400 rounded-full"></span>
                        Sales by Category
                    </h3>
                    <div className="h-72 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                            </div>
                        ) : categorySales.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                No sales data
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categorySales} layout="vertical" margin={{ left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="category_name" type="category" width={100} tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }} formatter={(value) => `Rs. ${(value as number || 0).toLocaleString()}`} />
                                    <Bar dataKey="total_sales" radius={[0, 6, 6, 0]} barSize={20}>
                                        {categorySales.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Details Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-100">Category Performance</h3>
                </div>
                <table className="min-w-full divide-y divide-slate-700/50">
                    <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Products Sold</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Share</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" /></td></tr>
                        ) : categorySales.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No category data</td></tr>
                        ) : (
                            categorySales.map((cat, i) => {
                                const totalCatSales = categorySales.reduce((s, c) => s + c.total_sales, 0);
                                const share = totalCatSales > 0 ? ((cat.total_sales / totalCatSales) * 100).toFixed(1) : '0';
                                return (
                                    <tr key={cat.category_id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span className="text-slate-200 font-medium">{cat.category_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">Rs. {cat.total_sales.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-400">{cat.product_count}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden max-w-[100px]">
                                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${share}%` }} />
                                                </div>
                                                <span className="text-sm text-slate-400">{share}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
