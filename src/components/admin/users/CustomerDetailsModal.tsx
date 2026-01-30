'use client';

import { X, Calendar, ShoppingBag, DollarSign, Mail, Phone, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCustomerDetails } from '@/actions/admin';

interface CustomerDetailsModalProps {
    customerId: string | null;
    onClose: () => void;
}

export default function CustomerDetailsModal({ customerId, onClose }: CustomerDetailsModalProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!customerId) return;

        async function fetchData() {
            setLoading(true);
            try {
                const result = await getCustomerDetails(customerId!);
                if (result.success) {
                    setData(result.data);
                } else {
                    console.error('Failed to fetch details:', result.error);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [customerId]);

    if (!customerId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#1e293b] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-700/50 shadow-2xl animate-in zoom-in-95 duration-200 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-[#1e293b] z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">Customer Details</h2>
                        <p className="text-sm text-slate-400">View customer history and insights.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-3" />
                        <p>Loading customer information...</p>
                    </div>
                ) : data ? (
                    <div className="overflow-y-auto max-h-[calc(85vh-85px)] p-6 space-y-8">

                        {/* Profile & Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile Card */}
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-3">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-300">
                                        {(data.first_name?.[0] || data.email?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-200 text-lg">
                                            {data.first_name} {data.last_name}
                                        </h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Active Customer
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-500" />
                                        {data.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-500" />
                                        {data.phone || 'No phone number'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        Joined: {new Date(data.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
                                        <DollarSign className="w-4 h-4" />
                                        Total Spent
                                    </div>
                                    <div className="text-xl font-bold text-emerald-400">
                                        PKR {data.stats?.totalSpent?.toLocaleString()}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
                                        <ShoppingBag className="w-4 h-4" />
                                        Total Orders
                                    </div>
                                    <div className="text-xl font-bold text-blue-400">
                                        {data.stats?.totalOrders}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-rose-500" />
                                Order History
                            </h3>
                            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                                {data.orders && data.orders.length > 0 ? (
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-800/50 text-slate-400 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Order ID</th>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {data.orders.map((order: any) => (
                                                <tr key={order.id} className="hover:bg-slate-800/50">
                                                    <td className="px-4 py-3 font-medium text-slate-300">
                                                        #{order.order_number || order.id.slice(0, 8)}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-400">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs capitalize ${order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' :
                                                                    'bg-blue-500/10 text-blue-400'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-200">
                                                        PKR {order.total.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-slate-500">
                                        No orders found for this customer.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="p-12 text-center text-rose-400">
                        Failed to load customer data.
                    </div>
                )}
            </div>
        </div>
    );
}
