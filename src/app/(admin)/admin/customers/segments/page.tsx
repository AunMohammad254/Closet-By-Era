'use client';

import { useState, useEffect } from 'react';
import { getCustomerRFMAnalysis, CustomerRFM, RFMSegment } from '@/actions/rfm';
import { Users, Crown, Heart, TrendingUp, UserPlus, AlertTriangle, Snowflake, UserX, Loader2 } from 'lucide-react';

const segmentConfig: Record<RFMSegment, {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    description: string;
}> = {
    champions: {
        label: 'Champions',
        icon: Crown,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        description: 'Best customers who buy often and recently'
    },
    loyal: {
        label: 'Loyal',
        icon: Heart,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10 border-rose-500/30',
        description: 'Frequent buyers with high spend'
    },
    potential: {
        label: 'Potential',
        icon: TrendingUp,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
        description: 'Decent engagement, room to grow'
    },
    new: {
        label: 'New',
        icon: UserPlus,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        description: 'Recent first-time buyers'
    },
    at_risk: {
        label: 'At Risk',
        icon: AlertTriangle,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10 border-orange-500/30',
        description: 'Used to buy but haven\'t recently'
    },
    hibernating: {
        label: 'Hibernating',
        icon: Snowflake,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/30',
        description: 'Haven\'t bought in a while'
    },
    lost: {
        label: 'Lost',
        icon: UserX,
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10 border-slate-500/30',
        description: 'May have churned'
    }
};

export default function CustomerSegmentsPage() {
    const [customers, setCustomers] = useState<CustomerRFM[]>([]);
    const [segments, setSegments] = useState<{ segment: RFMSegment; count: number; avg_monetary: number; avg_frequency: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSegment, setSelectedSegment] = useState<RFMSegment | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const result = await getCustomerRFMAnalysis();
        if (result.success && result.data) {
            setCustomers(result.data.customers);
            setSegments(result.data.segments);
        }
        setLoading(false);
    };

    const filteredCustomers = selectedSegment
        ? customers.filter(c => c.segment === selectedSegment)
        : customers;

    const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Customer Segments</h1>
                <p className="text-slate-400 text-sm mt-1">RFM analysis for targeted marketing</p>
            </div>

            {/* Segment Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {segments.map(seg => {
                    const config = segmentConfig[seg.segment];
                    const Icon = config.icon;
                    const isSelected = selectedSegment === seg.segment;

                    return (
                        <button
                            key={seg.segment}
                            onClick={() => setSelectedSegment(isSelected ? null : seg.segment)}
                            className={`p-4 rounded-xl border transition-all ${isSelected
                                    ? `${config.bgColor} ring-2 ring-offset-2 ring-offset-slate-900 ring-${config.color.replace('text-', '')}`
                                    : 'bg-[#1e293b] border-slate-700/50 hover:border-slate-600/50'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${config.color} mb-2`} />
                            <p className="text-lg font-bold text-slate-200">{seg.count}</p>
                            <p className="text-xs text-slate-400">{config.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Selected Segment Info */}
            {selectedSegment && (
                <div className={`p-4 rounded-xl border ${segmentConfig[selectedSegment].bgColor}`}>
                    <div className="flex items-center gap-3">
                        {(() => {
                            const Icon = segmentConfig[selectedSegment].icon;
                            return <Icon className={`w-6 h-6 ${segmentConfig[selectedSegment].color}`} />;
                        })()}
                        <div>
                            <h3 className={`font-semibold ${segmentConfig[selectedSegment].color}`}>
                                {segmentConfig[selectedSegment].label}
                            </h3>
                            <p className="text-sm text-slate-400">{segmentConfig[selectedSegment].description}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-slate-200">
                            {selectedSegment ? segmentConfig[selectedSegment].label : 'All'} Customers
                        </span>
                        <span className="text-sm text-slate-500">({filteredCustomers.length})</span>
                    </div>
                    {selectedSegment && (
                        <button
                            onClick={() => setSelectedSegment(null)}
                            className="text-sm text-slate-400 hover:text-slate-200"
                        >
                            Show All
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50 text-slate-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Customer</th>
                                <th className="px-4 py-3 text-center">Segment</th>
                                <th className="px-4 py-3 text-center">R</th>
                                <th className="px-4 py-3 text-center">F</th>
                                <th className="px-4 py-3 text-center">M</th>
                                <th className="px-4 py-3 text-right">Orders</th>
                                <th className="px-4 py-3 text-right">Total Spend</th>
                                <th className="px-4 py-3 text-right">Last Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredCustomers.slice(0, 50).map(customer => {
                                const config = segmentConfig[customer.segment];
                                const Icon = config.icon;

                                return (
                                    <tr key={customer.customer_id} className="hover:bg-slate-800/30">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-slate-200">
                                                    {customer.first_name} {customer.last_name}
                                                </p>
                                                <p className="text-xs text-slate-500">{customer.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bgColor}`}>
                                                <Icon className={`w-3 h-3 ${config.color}`} />
                                                <span className={config.color}>{config.label}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-mono ${customer.r_score >= 4 ? 'text-emerald-400' : customer.r_score <= 2 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {customer.r_score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-mono ${customer.f_score >= 4 ? 'text-emerald-400' : customer.f_score <= 2 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {customer.f_score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-mono ${customer.m_score >= 4 ? 'text-emerald-400' : customer.m_score <= 2 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {customer.m_score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-300">
                                            {customer.frequency}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-rose-400">
                                            {formatPrice(customer.monetary)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-500">
                                            {customer.last_order_date
                                                ? new Date(customer.last_order_date).toLocaleDateString()
                                                : '-'
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredCustomers.length > 50 && (
                    <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-700/50">
                        Showing top 50 of {filteredCustomers.length} customers
                    </div>
                )}
            </div>
        </div>
    );
}
