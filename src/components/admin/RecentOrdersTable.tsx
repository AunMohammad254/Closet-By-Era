'use client';

import { useEffect, useState } from 'react';
import { getRecentOrders } from '@/actions/orders';
import Link from 'next/link';

// Define Order type based on what we get from Supabase
interface Order {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    total: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shipping_address: any;
    customers?: { first_name: string | null; last_name: string | null; email: string | null };
}

export default function RecentOrdersTable() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const data = await getRecentOrders(5);
                setOrders(data || []);
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
        if (s === 'confirmed' || s === 'pending') return 'bg-blue-50 text-blue-600';
        if (s === 'processing') return 'bg-yellow-50 text-yellow-600';
        if (s === 'shipped') return 'bg-purple-50 text-purple-600';
        if (s === 'delivered') return 'bg-green-50 text-green-600';
        if (s === 'cancelled') return 'bg-red-50 text-red-600';
        return 'bg-gray-50 text-gray-600';
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Recent Orders
                </h3>
                <Link
                    href="/admin/orders"
                    className="text-sm text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors"
                >
                    View All Orders
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-4 whitespace-nowrap">Order ID</th>
                            <th className="px-8 py-4 whitespace-nowrap">Customer</th>
                            <th className="px-8 py-4 whitespace-nowrap">Date</th>
                            <th className="px-8 py-4 whitespace-nowrap">Status</th>
                            <th className="px-8 py-4 text-right whitespace-nowrap">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <span className="text-xl">📦</span>
                                        </div>
                                        <p className="font-medium">No recent orders found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-rose-50/30 transition-colors group">
                                    <td className="px-8 py-5 font-semibold text-gray-900">
                                        <Link href={`/admin/orders/${order.id}`} className="hover:text-rose-600 transition-colors">
                                            #{order.order_number}
                                        </Link>
                                    </td>
                                    <td className="px-8 py-5 text-gray-600 font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                {getCustomerName(order).charAt(0).toUpperCase()}
                                            </div>
                                            {getCustomerName(order)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-gray-500">{formatDate(order.created_at)}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-gray-900">
                                        PKR {order.total.toLocaleString()}
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
