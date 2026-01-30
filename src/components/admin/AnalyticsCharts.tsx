'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getAnalyticsSummary } from '@/actions/analytics';
import { Calendar, ChevronDown } from 'lucide-react';

interface AnalyticsData {
    timeline: { name: string; views: number, date: string }[];
    topProducts: { name: string; views: number }[];
}

export default function AnalyticsCharts() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const result = await getAnalyticsSummary(days);
                setData(result as unknown as AnalyticsData);
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [days]);

    const ranges = [
        { label: 'Last 7 Days', value: 7 },
        { label: 'Last 30 Days', value: 30 },
        { label: 'Last 90 Days', value: 90 },
        { label: 'Last Year', value: 365 },
    ];

    const currentRangeLabel = ranges.find(r => r.value === days)?.label || 'Select Range';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Views Timeline */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-2xl border border-slate-700/50 hover:shadow-lg hover:shadow-rose-500/5 transition-shadow duration-300 relative">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-1 h-5 bg-rose-400 rounded-full"></span>
                        Traffic Overview
                    </h3>

                    {/* Custom Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            <span>{currentRangeLabel}</span>
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-40 bg-[#1e293b] border border-slate-700/50 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                    {ranges.map((range) => (
                                        <button
                                            key={range.value}
                                            onClick={() => {
                                                setDays(range.value);
                                                setIsDropdownOpen(false);
                                            }}
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
                </div>

                <div className="h-72 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1e293b]/50 backdrop-blur-sm z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                        </div>
                    ) : (data && (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.timeline}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                                    itemStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#f43f5e" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ))}
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-2xl border border-slate-700/50 hover:shadow-lg hover:shadow-rose-500/5 transition-shadow duration-300">
                <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                    <span className="w-1 h-5 bg-rose-400 rounded-full"></span>
                    Most Viewed Products
                </h3>
                <div className="h-72 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1e293b]/50 backdrop-blur-sm z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                        </div>
                    ) : (data && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topProducts} layout="vertical" margin={{ left: 0, right: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={140}
                                    tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#334155', radius: 4 }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                                    itemStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Bar dataKey="views" radius={[0, 6, 6, 0]} barSize={24}>
                                    {data.topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ))}
                </div>
            </div>
        </div>
    );
}
