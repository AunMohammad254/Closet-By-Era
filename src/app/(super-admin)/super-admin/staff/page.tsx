'use client';

import { useState, useEffect } from 'react';
import { getStaffMembers, updateStaffRole, searchCustomersByEmail } from '@/actions/staff';
import { UserCog, Plus, Loader2, Search, Shield, ShieldCheck, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';

type StaffMember = {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: 'admin' | 'super_admin' | 'customer';
};

const roleColors = {
    super_admin: 'bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-400 border-amber-500/30',
    admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    customer: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

const roleIcons = {
    super_admin: ShieldCheck,
    admin: Shield,
    customer: UserMinus
};

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StaffMember[]>([]);
    const [showSearch, setShowSearch] = useState(false);

    const fetchStaff = async () => {
        setLoading(true);
        const result = await getStaffMembers();
        if (result.success && result.data) {
            setStaff(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        const result = await searchCustomersByEmail(searchQuery);
        if (result.success && result.data) {
            setSearchResults(result.data);
        }
        setSearching(false);
    };

    const handleAddStaff = async (customerId: string) => {
        const result = await updateStaffRole(customerId, 'admin');
        if (result.success) {
            toast.success('Staff member added');
            setShowSearch(false);
            setSearchQuery('');
            setSearchResults([]);
            fetchStaff();
        } else {
            toast.error(result.error || 'Failed to add staff');
        }
    };

    const handleRoleChange = async (customerId: string, newRole: 'admin' | 'super_admin' | 'customer') => {
        const result = await updateStaffRole(customerId, newRole);
        if (result.success) {
            toast.success('Role updated');
            fetchStaff();
        } else {
            toast.error(result.error || 'Failed to update role');
        }
    };

    const getName = (member: StaffMember) => {
        if (member.first_name) {
            return `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`;
        }
        return member.email.split('@')[0];
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Staff Management</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage admin and super-admin users</p>
                </div>
                <button
                    onClick={() => setShowSearch(true)}
                    className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Staff
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
                </div>
            ) : (
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 text-left">Staff Member</th>
                                <th className="px-6 py-4 text-left">Email</th>
                                <th className="px-6 py-4 text-left">Role</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {staff.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <UserCog className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No staff members found</p>
                                    </td>
                                </tr>
                            ) : (
                                staff.map(member => {
                                    const RoleIcon = roleIcons[member.role];
                                    return (
                                        <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-semibold">
                                                        {getName(member).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-slate-200">{getName(member)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">{member.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[member.role]}`}>
                                                    <RoleIcon className="w-3 h-3" />
                                                    {member.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'super_admin' | 'customer')}
                                                    className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg text-xs"
                                                >
                                                    <option value="super_admin">Super Admin</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="customer">Remove (Customer)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Search Modal */}
            {showSearch && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-slate-700/50">
                            <h3 className="font-semibold text-slate-200">Add Staff Member</h3>
                            <p className="text-sm text-slate-500">Search for a customer by email</p>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by email..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className="px-4 py-2.5 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 disabled:opacity-50"
                                >
                                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {searchResults.map(customer => (
                                        <div
                                            key={customer.id}
                                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-200">{customer.email}</p>
                                                <p className="text-xs text-slate-500">{getName(customer)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAddStaff(customer.id)}
                                                className="px-3 py-1.5 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20"
                                            >
                                                Add as Admin
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end">
                            <button
                                onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                                className="px-4 py-2 text-slate-400 hover:text-slate-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
