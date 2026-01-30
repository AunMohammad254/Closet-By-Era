'use client';

import { useState, useEffect } from 'react';
import { getAdminCustomers } from '@/actions/admin';
import { Customer } from '@/types/supabase';
import { Search, Loader2, RefreshCw, Eye } from 'lucide-react';
import CustomerDetailsModal from '@/components/admin/users/CustomerDetailsModal';

export default function UsersPage() {
    const [users, setUsers] = useState<Customer[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = users.filter(user =>
            (user.first_name?.toLowerCase().includes(lowerSearch) || false) ||
            (user.last_name?.toLowerCase().includes(lowerSearch) || false) ||
            (user.email?.toLowerCase().includes(lowerSearch) || false)
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const result = await getAdminCustomers();

            if (!result.success) {
                throw new Error(result.error);
            }

            setUsers(result.data || []);
            setFilteredUsers(result.data || []);
        } catch (error: any) {
            console.error('Error fetching users:', error.message || error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Customers</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage your registered customers.</p>
                </div>
                <div className="text-sm text-slate-400 font-medium px-4 py-2 bg-[#1e293b] rounded-lg border border-slate-700/50 shadow-sm">
                    Total: <span className="text-rose-400 ml-1">{users.length}</span>
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
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl">👥</span>
                                            <span>{searchTerm ? 'No customers found matching search.' : 'No customers found.'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
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

            {/* Customer Details Modal */}
            <CustomerDetailsModal
                customerId={selectedCustomerId}
                onClose={() => setSelectedCustomerId(null)}
            />
        </div>
    );
}
