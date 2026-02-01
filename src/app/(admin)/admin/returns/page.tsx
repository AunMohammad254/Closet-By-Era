'use client';

import { useState, useEffect, useCallback } from 'react';
import { getReturns, updateReturnStatus } from '@/actions/returns';
import { RotateCcw, Loader2, Check, X, Clock, RefreshCw, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

type Return = {
    id: string;
    order_id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'refunded';
    refund_amount: number;
    admin_notes: string | null;
    created_at: string;
    order?: { order_number: string; total_amount: number };
    customer?: { first_name: string; last_name: string; email: string };
};

const statusColors = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    refunded: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

const statusIcons = {
    pending: Clock,
    approved: Check,
    rejected: X,
    refunded: DollarSign
};

export default function ReturnsPage() {
    const [returns, setReturns] = useState<Return[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        const result = await getReturns({
            status: statusFilter !== 'all' ? statusFilter : undefined,
            offset: (page - 1) * pageSize,
            limit: pageSize
        });

        if (result.success && result.data) {
            setReturns(result.data.returns);
            setTotal(result.data.total);
        }
        setLoading(false);
    }, [statusFilter, page]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const handleUpdateStatus = async (returnId: string, newStatus: 'approved' | 'rejected' | 'refunded') => {
        setProcessingId(returnId);
        const result = await updateReturnStatus(returnId, newStatus);

        if (result.success) {
            toast.success(`Return ${newStatus} successfully`);
            fetchReturns();
        } else {
            toast.error(result.error || 'Failed to update return');
        }
        setProcessingId(null);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Returns & Refunds</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage customer return requests</p>
                </div>
                <div className="text-sm text-slate-400 font-medium px-4 py-2 bg-[#1e293b] rounded-lg border border-slate-700/50">
                    Total: <span className="text-rose-400 ml-1">{total}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-4 items-center">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="refunded">Refunded</option>
                </select>
                <button
                    onClick={fetchReturns}
                    className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800/50 text-slate-400 font-medium border-b border-slate-700/50">
                            <tr>
                                <th className="px-6 py-4">Order</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4">Refund Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin h-6 w-6 text-rose-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : returns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No return requests found</p>
                                    </td>
                                </tr>
                            ) : (
                                returns.map((ret) => {
                                    const StatusIcon = statusIcons[ret.status];
                                    return (
                                        <tr key={ret.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-200">
                                                #{ret.order?.order_number || ret.order_id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {ret.customer?.first_name} {ret.customer?.last_name}
                                                <br />
                                                <span className="text-xs text-slate-500">{ret.customer?.email}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                                                {ret.reason}
                                            </td>
                                            <td className="px-6 py-4 text-slate-200">
                                                Rs. {ret.refund_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[ret.status]}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(ret.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {ret.status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleUpdateStatus(ret.id, 'approved')}
                                                            disabled={processingId === ret.id}
                                                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(ret.id, 'rejected')}
                                                            disabled={processingId === ret.id}
                                                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {ret.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(ret.id, 'refunded')}
                                                        disabled={processingId === ret.id}
                                                        className="px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                                    >
                                                        Process Refund
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-[#1e293b] px-6 py-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-4 py-2 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
