'use client';

import { useState } from 'react';
import { createCoupon, deleteCoupon, type Coupon } from '@/actions/coupons';
import { Loader2, Save, X, Calendar } from 'lucide-react';

interface CouponFormProps {
    coupon?: Coupon | null; // For future edit support
    onClose: () => void;
}

export default function CouponForm({ coupon, onClose }: CouponFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        // Basic validation
        const code = formData.get('code') as string;
        if (!code || code.length < 3) {
            setError('Code must be at least 3 characters');
            setSubmitting(false);
            return;
        }

        const data = {
            code: code,
            discount_type: formData.get('discount_type') as 'percentage' | 'fixed',
            discount_value: parseFloat(formData.get('discount_value') as string),
            min_order_amount: parseFloat(formData.get('min_order_amount') as string) || 0,
            max_uses: formData.get('max_uses') ? parseInt(formData.get('max_uses') as string) : null,
            ends_at: formData.get('ends_at') ? new Date(formData.get('ends_at') as string).toISOString() : null,
            is_active: formData.get('is_active') === 'on',
        };

        try {
            // Currently only create is fully implemented in actions logic for the form context (though update could be added)
            // But we'll use createCoupon. 
            // If we add edit later, we'd use updateCoupon (which I haven't created in actions yet, only create/delete/get).
            // Wait, I only made create, get, delete. So I can't support Edit properly yet without adding updateCoupon action.
            // For now, I will treat this as Create Only unless I add Update action.
            // The task list said "Create Coupons Admin Page (List & Create)". It didn't explicitly demand Edit, but it's nice to have.
            // I'll stick to Create for now to be safe and fast.

            if (coupon) {
                setError('Editing not yet supported');
                setSubmitting(false);
                return;
            }

            const result = await createCoupon({
                ...data,
                created_at: '', // ignore
                uses_count: 0 // ignore
            } as any); // Casting because createCoupon expects Omit<Coupon...> but strict TS might complain about extras

            if (result.success) {
                onClose();
            } else {
                setError(result.error || 'Failed to save coupon');
            }
        } catch (err: any) {
            setError('An unexpected error occurred: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700/50 overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-slate-100">
                        {coupon ? 'Edit Coupon' : 'Create New Coupon'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-500/10 text-rose-400 rounded-xl text-sm border border-rose-500/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Coupon Code
                            </label>
                            <input
                                type="text"
                                name="code"
                                defaultValue={coupon?.code}
                                required
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-500 uppercase font-mono"
                                placeholder="e.g. SUMMER20"
                                onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Discount Type
                                </label>
                                <select
                                    name="discount_type"
                                    defaultValue={coupon?.discount_type || 'percentage'}
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Discount Value
                                </label>
                                <input
                                    type="number"
                                    name="discount_value"
                                    defaultValue={coupon?.discount_value}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Min Order Amount
                                </label>
                                <input
                                    type="number"
                                    name="min_order_amount"
                                    defaultValue={coupon?.min_order_amount || 0}
                                    min="0"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Usage Limit
                                </label>
                                <input
                                    type="number"
                                    name="max_uses"
                                    defaultValue={coupon?.max_uses || ''}
                                    min="1"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                    placeholder="Unlimited"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Expiration Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="datetime-local"
                                    name="ends_at"
                                    defaultValue={coupon?.ends_at ? new Date(coupon.ends_at).toISOString().slice(0, 16) : ''}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        defaultChecked={coupon?.is_active ?? true}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 peer-checked:after:bg-white"></div>
                                </div>
                                <span className="text-sm font-medium text-slate-300">Active Status</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-700/50 text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 hover:text-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {coupon ? 'Update Coupon' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
