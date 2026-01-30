'use client';

import { useEffect, useState } from 'react';
import { getRecentOrders } from '@/actions/orders';
import Link from 'next/link';

// Define Order type based on what we get from Supabase
interface Order {
    id: string;
    order_number: string | null;
    created_at: string;
    status: string;
    total?: number | null;
    total_amount?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shipping_address: any;
    customers?: { first_name: string | null; last_name: string | null; email: string | null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Allow additional properties
}

export default function RecentOrdersTable() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const data = await getRecentOrders(5);
                setOrders((data || []) as Order[]);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'confirmed' || s === 'pending') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        if (s === 'processing') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        if (s === 'shipped') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        if (s === 'delivered') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (s === 'cancelled') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        return 'bg-slate-700/50 text-slate-400 border-slate-600/50';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Helper to get customer name
    const getCustomerName = (order: Order) => {
        // If we have customer relation (from auth)
        if (order.customers) {
            return `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim() || order.customers.email || 'Customer';
        }
        // Fallback to shipping address
        const addr = order.shipping_address;
        if (addr && typeof addr === 'object') {
            return `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
        }
        return 'Guest';
    };

    if (loading) {
        return (
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden hover:shadow-lg hover:shadow-rose-500/5 transition-shadow duration-300">
            <div className="px-8 py-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    Recent Orders
                </h3>
                <Link
                    href="/admin/orders"
                    className="text-sm text-rose-400 hover:text-rose-300 font-semibold hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-colors"
                >
                    View All Orders
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-700/50">
                        <tr>
                            <th className="px-8 py-4 whitespace-nowrap">Order ID</th>
                            <th className="px-8 py-4 whitespace-nowrap">Customer</th>
                            <th className="px-8 py-4 whitespace-nowrap">Date</th>
                            <th className="px-8 py-4 whitespace-nowrap">Status</th>
                            <th className="px-8 py-4 text-right whitespace-nowrap">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                                            <span className="text-xl">📦</span>
                                        </div>
                                        <p className="font-medium">No recent orders found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-8 py-5 font-semibold text-slate-200">
                                        <Link href={`/admin/orders/${order.id}`} className="hover:text-rose-400 transition-colors">
                                            #{order.order_number}
                                        </Link>
                                    </td>
                                    <td className="px-8 py-5 text-slate-300 font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-rose-500/10 group-hover:text-rose-400 transition-all">
                                                {getCustomerName(order).charAt(0).toUpperCase()}
                                            </div>
                                            {getCustomerName(order)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-slate-500">{formatDate(order.created_at)}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-slate-200">
                                        PKR {(order.total ?? order.total_amount ?? 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
