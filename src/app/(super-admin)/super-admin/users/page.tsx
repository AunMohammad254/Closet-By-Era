'use client';

import { useState, useEffect } from 'react';
import { getAllUsersWithRoles, updateUserRole, type UserWithRole } from '@/actions/super-admin';
import { Users, Search, Shield, ShieldCheck, User, Loader2, ChevronDown } from 'lucide-react';

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            const data = await getAllUsersWithRoles();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
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
            } else {
                alert(result.error || 'Failed to update role');
            }
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update role');
        } finally {
            setUpdating(null);
        }
    }

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

            {/* Users Table */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">User</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Email</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Role</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Joined</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                                                {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {user.first_name} {user.last_name}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative">
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
                                                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-purple-400" />
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
            </div>
        </div>
    );
}
