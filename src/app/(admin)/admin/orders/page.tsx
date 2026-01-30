import { getOrders } from '@/actions/orders';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OrdersToolbar from '@/components/admin/orders/OrdersToolbar';

export const metadata = {
    title: 'Orders | Admin Dashboard',
};

export const dynamic = 'force-dynamic';

interface Order {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    total: number;
    shipping_address: any;
    customer?: { first_name: string; last_name: string; email: string };
    items?: any[];
}

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const status = resolvedParams.status || 'All';
    const pageSize = 10;

    const { data: orders, count } = await getOrders(page, pageSize, status);
    const totalPages = Math.ceil((count || 0) / pageSize);

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCustomerName = (order: Order) => {
        // @ts-expect-error - customers relation
        if (order.customers) {
            // @ts-expect-error - customers relation
            return `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim() || order.customers.email;
        }
        const addr = order.shipping_address;
        if (addr && typeof addr === 'object') {
            return `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
        }
        return 'Guest';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Orders</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage and fulfill store orders.</p>
                </div>
            </div>

            {/* Toolbar (Search, Filter, Export) */}
            <OrdersToolbar />

            {/* Orders Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-700/50">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {!orders || orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl">📦</span>
                                            <span>No orders found matching your criteria.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-200">
                                            #{order.order_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-rose-500/10 group-hover:text-rose-400 transition-all">
                                                    {getCustomerName(order).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-200">{getCustomerName(order)}</div>
                                                    <div className="text-xs text-slate-500">{order.email || order.shipping_address?.email || 'No email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{formatDate(order.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-200">
                                            PKR {(order.total || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="text-rose-400 hover:text-rose-300 font-medium hover:underline"
                                            >
                                                Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Showing page <span className="font-medium text-slate-200">{page}</span> of <span className="font-medium text-slate-200">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <Link
                                href={`/admin/orders?page=${page - 1}&status=${status}`}
                                className={`p-2 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                            <Link
                                href={`/admin/orders?page=${page + 1}&status=${status}`}
                                className={`p-2 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
