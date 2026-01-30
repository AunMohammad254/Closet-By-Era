'use client';

import { useState } from 'react';
import { Filter, Download, Loader2, Search, X, Check } from 'lucide-react';
import { getAllOrdersForExport } from '@/actions/orders';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OrdersToolbar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isExporting, setIsExporting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Search state
    const currentSearch = searchParams.get('search') || '';
    const [searchTerm, setSearchTerm] = useState(currentSearch);

    // Initial filter state from URL
    const currentStatus = searchParams.get('status') || 'All';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchTerm) {
            params.set('search', searchTerm);
        } else {
            params.delete('search');
        }
        params.set('page', '1'); // Reset pagination
        router.push(`/admin/orders?${params.toString()}`);
    };

    const handleStatusFilter = (status: string) => {
        const params = new URLSearchParams(searchParams);
        if (status && status !== 'All') {
            params.set('status', status);
        } else {
            params.delete('status');
        }
        params.set('page', '1');
        router.push(`/admin/orders?${params.toString()}`);
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const status = searchParams.get('status') || 'All';
            const orders = await getAllOrdersForExport(status);

            if (!orders || orders.length === 0) {
                alert('No orders to export');
                return;
            }

            // Convert to CSV
            const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Status', 'Total', 'Items Count'];
            const csvData = orders.map((order: any) => [
                order.order_number || order.id,
                new Date(order.created_at).toLocaleDateString(),
                `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Guest',
                order.customer?.email || order.shipping_address?.email || '',
                order.status,
                order.total,
                order.items?.length || 0
            ]);

            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Export failed', error);
            alert('Failed to export orders');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search orders..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all placeholder:text-slate-500"
                    />
                </form>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex-1 sm:flex-none px-4 py-2.5 border ${showFilters ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-[#1e293b] border-slate-700/50 text-slate-400'} rounded-xl text-sm font-medium hover:bg-slate-700/50 hover:text-slate-200 transition-colors flex items-center justify-center gap-2`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
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

            {/* Expanded Filters Area */}
            {showFilters && (
                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => {
                                    const isSelected = currentStatus === status;
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm'
                                                    : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-200'
                                                }`}
                                        >
                                            {status}
                                            {isSelected && <Check className="w-3 h-3 inline-block ml-1.5" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
