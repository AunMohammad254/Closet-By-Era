'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getAllCustomersWithLoyalty,
    adjustLoyaltyPoints,
    getCustomerLoyaltyHistory,
    type CustomerWithLoyalty,
    type LoyaltyHistory
} from '@/actions/loyalty';
import {
    Search,
    Loader2,
    RefreshCw,
    Coins,
    Plus,
    Minus,
    History,
    X,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

export default function LoyaltyPage() {
    const [customers, setCustomers] = useState<CustomerWithLoyalty[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const pageSize = 15;

    // Adjustment modal state
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithLoyalty | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState(0);
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [adjusting, setAdjusting] = useState(false);

    // History modal state
    const [historyCustomer, setHistoryCustomer] = useState<CustomerWithLoyalty | null>(null);
    const [history, setHistory] = useState<LoyaltyHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        const result = await getAllCustomersWithLoyalty(page, pageSize, search || undefined);
        setCustomers(result.customers);
        setTotal(result.total);
        setLoading(false);
    }, [page, search]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchCustomers();
    };

    const handleAdjust = async () => {
        if (!selectedCustomer || adjustmentAmount === 0) return;

        setAdjusting(true);
        const result = await adjustLoyaltyPoints(
            selectedCustomer.id,
            adjustmentAmount,
            adjustmentReason
        );

        if (result.success) {
            setSelectedCustomer(null);
            setAdjustmentAmount(0);
            setAdjustmentReason('');
            await fetchCustomers();
        } else {
            alert('Error: ' + result.error);
        }
        setAdjusting(false);
    };

    const handleViewHistory = async (customer: CustomerWithLoyalty) => {
        setHistoryCustomer(customer);
        setLoadingHistory(true);
        const hist = await getCustomerLoyaltyHistory(customer.id);
        setHistory(hist);
        setLoadingHistory(false);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Loyalty Program</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage customer loyalty points and view history.</p>
                </div>
                <button
                    onClick={fetchCustomers}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-700 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all placeholder:text-slate-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Customers Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-700/50">
                    <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Points</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" />
                                    <p className="text-slate-500 mt-2">Loading customers...</p>
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <Coins className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                    <p className="text-slate-500">No customers found</p>
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-slate-200 font-medium">
                                            {customer.first_name} {customer.last_name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {customer.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg font-medium">
                                            <Coins className="w-4 h-4 mr-1.5" />
                                            {customer.loyalty_points.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedCustomer(customer)}
                                                className="inline-flex items-center px-3 py-1.5 text-sm bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                Adjust
                                            </button>
                                            <button
                                                onClick={() => handleViewHistory(customer)}
                                                className="inline-flex items-center px-3 py-1.5 text-sm bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                                            >
                                                <History className="w-3.5 h-3.5 mr-1" />
                                                History
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-[#1e293b] px-6 py-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Showing page <span className="font-medium text-slate-200">{page}</span> of <span className="font-medium text-slate-200">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-4 py-2 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Adjustment Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-100">Adjust Points</h3>
                            <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-slate-400 text-sm">Customer</p>
                                <p className="text-slate-200 font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                                <p className="text-slate-500 text-sm">{selectedCustomer.email}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Current Balance</p>
                                <span className="inline-flex items-center px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg font-medium">
                                    <Coins className="w-4 h-4 mr-1.5" />
                                    {selectedCustomer.loyalty_points.toLocaleString()} points
                                </span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Adjustment Amount</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAdjustmentAmount(Math.abs(adjustmentAmount))}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${adjustmentAmount >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setAdjustmentAmount(-Math.abs(adjustmentAmount || 1))}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${adjustmentAmount < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'}`}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={Math.abs(adjustmentAmount)}
                                        onChange={(e) => {
                                            const val = Math.abs(Number(e.target.value));
                                            setAdjustmentAmount(adjustmentAmount < 0 ? -val : val);
                                        }}
                                        className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Reason</label>
                                <input
                                    type="text"
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                    placeholder="e.g. Promotional bonus, Refund, etc."
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 placeholder:text-slate-500"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-700/50 flex gap-3">
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="flex-1 px-4 py-2.5 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdjust}
                                disabled={adjusting || adjustmentAmount === 0}
                                className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50"
                            >
                                {adjusting ? 'Saving...' : 'Apply Adjustment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-lg max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-100">Points History</h3>
                                <p className="text-slate-400 text-sm">{historyCustomer.first_name} {historyCustomer.last_name}</p>
                            </div>
                            <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingHistory ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <History className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                                    <p>No history found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((entry) => (
                                        <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-xl">
                                            <div className={`p-2 rounded-lg ${entry.points >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                {entry.points >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className={`font-medium ${entry.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {entry.points >= 0 ? '+' : ''}{entry.points} points
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(entry.created_at).toLocaleDateString('en-PK', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 mt-0.5">{entry.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
