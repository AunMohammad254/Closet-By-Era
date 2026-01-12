import { getOrders } from '@/actions/orders';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';

export const metadata = {
    title: 'Orders | Admin Dashboard',
};

// Define types locally since we aren't sharing them yet
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

    // Use await for searchParams in Next.js 15+ if needed, but for 14/15 stable it's fine.
    // Actually in Next.js 15 searchParams is a Promise. We should await it if using latest.
    // Assuming Next.js 14/15 based on "use client" directives seen elsewhere. 
    // Wait, the user said Next.js 16.0.10. So searchParams IS a promise.

    // We need to resolve params first if using Next 15+ dynamic APIs.
    // But since I can't be 100% sure of the exact Next.js version behavior for searchParams in this precise patch, 
    // I will write standard component code. If it errors, I'll fix.
    // Safe bet: standard props.

    const { data: orders, count } = await getOrders(page, pageSize, status);
    const totalPages = Math.ceil((count || 0) / pageSize);

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCustomerName = (order: Order) => {
        // @ts-ignore
        if (order.customers) {
            // @ts-ignore
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
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and fulfill store orders.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                        Export Orders
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                        <Link
                            key={s}
                            href={`/admin/orders?status=${s}`}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${status === s || (status === 'All' && s === 'All')
                                ? 'bg-slate-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {s}
                        </Link>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Order ID</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!orders || orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No orders found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {order.order_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{getCustomerName(order)}</div>
                                            <div className="text-xs text-gray-500">{order.email || order.shipping_address?.email || 'No email'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{formatDate(order.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            PKR {order.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="text-rose-600 hover:text-rose-700 font-medium"
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
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <Link
                                href={`/admin/orders?page=${page - 1}&status=${status}`}
                                className={`p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                            <Link
                                href={`/admin/orders?page=${page + 1}&status=${status}`}
                                className={`p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
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
