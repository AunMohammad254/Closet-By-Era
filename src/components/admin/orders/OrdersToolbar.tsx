'use client';

import { useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { getAllOrdersForExport, type OrderFilters } from '@/actions/orders';
import { useRouter, useSearchParams } from 'next/navigation';
import { getOrderCustomerEmail, getOrderCustomerName, toCsvCell } from '@/lib/order-display';
import AdvancedFilters from '@/components/admin/AdvancedFilters';
import { PAYMENT_METHOD_LABELS } from '@/lib/payments';

/** URL search params that hold order filters (search has its own box). */
const FILTER_KEYS = ['status', 'payment_status', 'payment_method', 'from', 'to'] as const;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const FILTER_FIELDS = [
    {
        key: 'status',
        label: 'Order status',
        type: 'select' as const,
        options: ['pending', 'packed', 'shipping', 'delivered', 'cancelled'].map(v => ({ value: v, label: capitalize(v) })),
    },
    {
        key: 'payment_status',
        label: 'Payment status',
        type: 'select' as const,
        options: ['pending', 'paid', 'failed', 'refunded'].map(v => ({ value: v, label: capitalize(v) })),
    },
    {
        key: 'payment_method',
        label: 'Payment method',
        type: 'select' as const,
        options: ['cod', 'bank_transfer', 'jazzcash', 'easypaisa', 'card'].map(v => ({ value: v, label: PAYMENT_METHOD_LABELS[v] })),
    },
    { key: 'from', label: 'Placed from', type: 'date' as const },
    { key: 'to', label: 'Placed until', type: 'date' as const },
];

export default function OrdersToolbar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isExporting, setIsExporting] = useState(false);

    // Search state
    const currentSearch = searchParams.get('search') || '';
    const [searchTerm, setSearchTerm] = useState(currentSearch);

    const currentFilters: Record<string, string> = Object.fromEntries(
        FILTER_KEYS.map(key => [key, searchParams.get(key) || '']).filter(([, value]) => value)
    );

    const pushParams = (params: URLSearchParams) => {
        params.set('page', '1'); // Reset pagination
        router.push(`/admin/orders?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
        } else {
            params.delete('search');
        }
        pushParams(params);
    };

    const handleApplyFilters = (filters: Record<string, string>) => {
        const params = new URLSearchParams(searchParams);
        for (const key of FILTER_KEYS) {
            if (filters[key]) params.set(key, filters[key]);
            else params.delete(key);
        }
        pushParams(params);
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const filters: OrderFilters = { ...currentFilters, search: currentSearch };
            const orders = await getAllOrdersForExport(filters);

            if (!orders || orders.length === 0) {
                alert('No orders to export');
                return;
            }

            // Convert to CSV
            const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Status', 'Payment', 'Payment Status', 'Total', 'Items Count'];
            const csvData = orders.map((order) => [
                order.order_number || order.id,
                new Date(order.created_at).toLocaleDateString(),
                getOrderCustomerName(order),
                getOrderCustomerEmail(order),
                order.status,
                PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method,
                order.payment_status,
                order.total,
                order.items?.length || 0
            ]);

            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(toCsvCell).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed', error);
            alert('Failed to export orders');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Order number, name or email"
                    aria-label="Search orders"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all placeholder:text-slate-500"
                />
            </form>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
                <AdvancedFilters
                    entityType="orders"
                    currentFilters={currentFilters}
                    onApplyFilters={handleApplyFilters}
                    filterFields={FILTER_FIELDS}
                />
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export
                </button>
            </div>
        </div>
    );
}
