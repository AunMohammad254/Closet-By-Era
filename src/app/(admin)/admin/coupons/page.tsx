'use client';

import { useState, useEffect } from 'react';
import { getCoupons, deleteCoupon, type Coupon } from '@/actions/coupons'; // Using type from actions
import { Plus, Trash2, Search, Loader2, RefreshCw, Ticket } from 'lucide-react';
import CouponForm from '@/components/admin/coupons/CouponForm';

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const result = await getCoupons();
            if (result.success && result.data) {
                setCoupons(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) return;

        setDeletingId(id);
        const result = await deleteCoupon(id);
        if (result.success) {
            await fetchCoupons();
        } else {
            alert(result.error || 'Failed to delete coupon');
        }
        setDeletingId(null);
    };

    const handleEdit = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setIsFormOpen(true);
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Discounts & Coupons</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage store discount codes</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedCoupon(null);
                        setIsFormOpen(true);
                    }}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all placeholder:text-slate-500 uppercase"
                    />
                </div>
                <button
                    onClick={fetchCoupons}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors"
                    title="Refresh List"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700/50">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usage</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expires</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading && coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
                                            <span>Loading coupons...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-500">
                                                <Ticket size={24} />
                                            </div>
                                            <p>No coupons found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCoupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded text-sm">
                                                {coupon.code}
                                            </span>
                                            {coupon.min_order_amount > 0 && (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    Min Order: {coupon.min_order_amount}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                                            {coupon.discount_type === 'percentage'
                                                ? `${coupon.discount_value}% OFF`
                                                : `PKR ${coupon.discount_value} OFF`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.is_active
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                                                }`}>
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {coupon.uses_count} / {coupon.max_uses ? coupon.max_uses : '∞'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {coupon.ends_at
                                                ? new Date(coupon.ends_at).toLocaleDateString()
                                                : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(coupon)}
                                                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    disabled={deletingId === coupon.id}
                                                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deletingId === coupon.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <CouponForm
                    coupon={selectedCoupon}
                    onClose={() => {
                        setIsFormOpen(false);
                        setSelectedCoupon(null);
                        fetchCoupons(); // Refresh list
                    }}
                />
            )}
        </div>
    );
}
