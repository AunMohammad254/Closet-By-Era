'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminCustomers } from '@/actions/admin';
import { Customer } from '@/types/database';
import { Search, Loader2, RefreshCw, Eye } from 'lucide-react';
import CustomerDetailsModal from '@/components/admin/users/CustomerDetailsModal';

export default function UsersPage() {
    const [users, setUsers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    // Modal state
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to first page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * pageSize;
            const result = await getAdminCustomers({
                offset,
                limit: pageSize,
                search: debouncedSearch || undefined
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            setUsers(result.data?.customers || []);
            setTotal(result.data?.total || 0);
        } catch (error: any) {
            console.error('Error fetching users:', error.message || error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Customers</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage your registered customers.</p>
                </div>
                <div className="text-sm text-slate-400 font-medium px-4 py-2 bg-[#1e293b] rounded-lg border border-slate-700/50 shadow-sm">
                    Total: <span className="text-rose-400 ml-1">{total}</span>
                </div>
            </div>

            {/* Search and Toolbar */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all placeholder:text-slate-500"
                    />
                </div>
                <button
                    onClick={fetchUsers}
                    className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors self-end sm:self-auto"
                    title="Refresh List"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-[#1e293b] rounded-xl shadow-sm border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800/50 text-slate-400 font-medium border-b border-slate-700/50">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin h-6 w-6 text-rose-500 mx-auto" />
                                        <p className="text-slate-400 mt-2">Loading customers...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl">👥</span>
                                            <span>{searchTerm ? 'No customers found matching search.' : 'No customers found.'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        onClick={() => setSelectedCustomerId(user.id)}
                                        className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-rose-500/10 group-hover:text-rose-400 transition-all">
                                                    {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                                                </div>
                                                {user.first_name || user.last_name ?
                                                    `${user.first_name || ''} ${user.last_name || ''}`.trim() :
                                                    'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {user.email || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCustomerId(user.id);
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-[#1e293b] px-6 py-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Showing page <span className="font-medium text-slate-200">{page}</span> of <span className="font-medium text-slate-200">{totalPages}</span>
                        <span className="ml-2 text-slate-500">({total} total)</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="px-4 py-2 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Customer Details Modal */}
            <CustomerDetailsModal
                customerId={selectedCustomerId}
                onClose={() => setSelectedCustomerId(null)}
            />
        </div>
    );
}
