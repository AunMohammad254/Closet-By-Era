'use client';

import { useState, useEffect } from 'react';
import { getAllUsersWithRoles, updateUserRole, exportUsersCSV, getUserActivity, bulkUpdateUserRoles, getLoginHistory, type UserWithRole } from '@/actions/super-admin';
import { Users, Search, Shield, ShieldCheck, User, Loader2, ChevronDown, RefreshCw, Download, Eye, X, Clock, ShoppingBag, FileText, CheckSquare, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [updating, setUpdating] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    // Activity Modal State
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [fetchActivityLoading, setFetchActivityLoading] = useState(false);
    const [activityData, setActivityData] = useState<any>(null);

    // Bulk Actions State
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [bulkUpdating, setBulkUpdating] = useState(false);

    useEffect(() => {
        loadUsers(true);
    }, []);

    async function handleViewActivity(userId: string) {
        setShowActivityModal(true);
        setFetchActivityLoading(true);
        setActivityData(null);
        try {
            const [activity, loginHistory] = await Promise.all([
                getUserActivity(userId),
                getLoginHistory(userId)
            ]);
            setActivityData({
                ...activity,
                logins: loginHistory
            });
        } catch (error) {
            console.error('Failed to load activity:', error);
            toast.error('Failed to load activity');
        } finally {
            setFetchActivityLoading(false);
        }
    }


    async function loadUsers(reset = false) {
        const isLoadingMore = !reset && users.length > 0;
        isLoadingMore ? setLoadingMore(true) : setLoading(true);

        try {
            const offset = reset ? 0 : users.length;
            const result = await getAllUsersWithRoles({ offset, limit: PAGE_SIZE });

            if (reset) {
                setUsers(result.users);
            } else {
                setUsers(prev => [...prev, ...result.users]);
            }
            setTotal(result.total);
            setSelectedUsers([]); // Clear selection on load
        } catch (error) {
            console.error('Failed to load users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    async function handleRoleChange(userId: string, newRole: 'customer' | 'admin' | 'super_admin') {
        setUpdating(userId);
        try {
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
                setUsers(users.map(u =>
                    u.id === userId ? { ...u, role: newRole } : u
                ));
                toast.success('Role updated successfully');
            } else {
                toast.error(result.error || 'Failed to update role');
            }
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Failed to update role');
        } finally {
            setUpdating(null);
        }
    }

    async function handleBulkUpdate(newRole: 'customer' | 'admin' | 'super_admin') {
        if (!confirm(`Are you sure you want to change the role of ${selectedUsers.length} users to ${newRole.replace('_', ' ')}?`)) return;

        setBulkUpdating(true);
        const toastId = toast.loading('Updating roles...');

        try {
            const result = await bulkUpdateUserRoles(selectedUsers, newRole);
            if (result.success) {
                setUsers(users.map(u =>
                    selectedUsers.includes(u.id) ? { ...u, role: newRole } : u
                ));
                toast.success('Roles updated successfully', { id: toastId });
                setSelectedUsers([]);
            } else {
                toast.error(result.error || 'Failed to update roles', { id: toastId });
            }
        } catch (error) {
            console.error('Bulk update error:', error);
            toast.error('Failed to update roles', { id: toastId });
        } finally {
            setBulkUpdating(false);
        }
    }

    async function handleExport() {
        const toastId = toast.loading('Generating CSV...');
        try {
            const csv = await exportUsersCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Export completed', { id: toastId });
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Export failed', { id: toastId });
        }
    }

    // Bulk Actions Handlers
    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    const toggleSelectUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            (user.first_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (user.last_name?.toLowerCase() || '').includes(search.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <Shield className="w-4 h-4 text-purple-400" />;
            case 'admin':
                return <ShieldCheck className="w-4 h-4 text-green-400" />;
            default:
                return <User className="w-4 h-4 text-slate-400" />;
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'admin':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-400" />
                    User Management
                </h1>
                <p className="text-slate-400 mt-1">Manage user roles and permissions</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="admin">Admins</option>
                    <option value="super_admin">Super Admins</option>
                </select>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl text-white transition-colors"
                    title="Export to CSV"
                >
                    <Download className="w-5 h-5 text-purple-400" />
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'customer').length}</p>
                    <p className="text-sm text-slate-400">Customers</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{users.filter(u => u.role === 'admin').length}</p>
                    <p className="text-sm text-green-400/70">Admins</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'super_admin').length}</p>
                    <p className="text-sm text-purple-400/70">Super Admins</p>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUsers.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-white font-medium">
                        <CheckSquare className="w-5 h-5 text-purple-400" />
                        <span>{selectedUsers.length} users selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-purple-200">Set Role:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkUpdate('customer')}
                                disabled={bulkUpdating}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-colors border border-purple-500/30"
                            >
                                Customer
                            </button>
                            <button
                                onClick={() => handleBulkUpdate('admin')}
                                disabled={bulkUpdating}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 text-sm rounded-lg transition-colors border border-purple-500/30"
                            >
                                Admin
                            </button>
                            <button
                                onClick={() => handleBulkUpdate('super_admin')}
                                disabled={bulkUpdating}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-400 text-sm rounded-lg transition-colors border border-purple-500/30"
                            >
                                Super Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700/50">
                                <th className="px-6 py-4 text-left">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-600 bg-slate-700/50 text-purple-600 focus:ring-purple-500"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-600 bg-slate-700/50 text-purple-600 focus:ring-purple-500"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleSelectUser(user.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                <User className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.first_name || 'User'} {user.last_name || ''}</p>
                                                <p className="text-slate-400 text-sm">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                            {user.role === 'super_admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                                            {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                            {user.role === 'customer' && <User className="w-3 h-3 mr-1" />}
                                            {user.role?.replace('_', ' ') || 'customer'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewActivity(user.id)}
                                                className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-purple-400 transition-colors"
                                                title="View Activity"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as 'customer' | 'admin' | 'super_admin')}
                                                disabled={updating === user.id || user.role === 'super_admin'}
                                                className="appearance-none bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                            {updating === user.id ? (
                                                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-purple-400 pointer-events-none" />
                                            ) : (
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No users found</p>
                    </div>
                )}

                {/* Pagination info and Load More */}
                {users.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
                        <p className="text-sm text-slate-400">
                            Showing {users.length} of {total} users
                        </p>
                        {users.length < total && (
                            <button
                                onClick={() => loadUsers(false)}
                                disabled={loadingMore}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Load More
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-400" />
                                User Activity
                            </h2>
                            <button
                                onClick={() => setShowActivityModal(false)}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {fetchActivityLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                </div>
                            ) : (
                                <>
                                    {/* Recent Orders */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4" />
                                            Recent Orders
                                        </h3>
                                        <div className="space-y-3">
                                            {activityData?.orders?.length === 0 ? (
                                                <p className="text-slate-500 text-sm italic">No orders found.</p>
                                            ) : (
                                                activityData?.orders?.map((order: any) => (
                                                    <div key={order.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">Order #{order.id.slice(0, 8)}</p>
                                                            <p className="text-slate-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-white font-bold">Rs. {Number(order.total_amount).toLocaleString()}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                                order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                                    'bg-slate-500/20 text-slate-400'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Activity (Logs) */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Recent System Logs
                                        </h3>
                                        <div className="space-y-3">
                                            {activityData?.logs?.length === 0 ? (
                                                <p className="text-slate-500 text-sm italic">No logs found.</p>
                                            ) : (
                                                activityData?.logs?.map((log: any) => (
                                                    <div key={log.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-purple-400 font-medium text-sm capitalize">{log.action.replace(/_/g, ' ')}</span>
                                                            <span className="text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-slate-300 text-sm mt-1">
                                                            {log.entity} {log.entity_id ? `#${log.entity_id.slice(0, 8)}` : ''}
                                                        </p>
                                                        {log.details && (
                                                            <pre className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-500 overflow-x-auto">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Login History */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Monitor className="w-4 h-4" />
                                            Login History
                                        </h3>
                                        <div className="space-y-3">
                                            {activityData?.logins?.length === 0 ? (
                                                <p className="text-slate-500 text-sm italic">No login history found.</p>
                                            ) : (
                                                activityData?.logins?.map((login: any) => (
                                                    <div key={login.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{login.ip_address}</p>
                                                            <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]" title={login.user_agent}>
                                                                {login.user_agent}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-slate-400 text-xs">{new Date(login.created_at).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
