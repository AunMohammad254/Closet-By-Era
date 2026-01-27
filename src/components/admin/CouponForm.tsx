'use client';

import { useState } from 'react';
import { Coupon, CouponFormData, createCoupon, updateCoupon } from '@/actions/coupons';

interface CouponFormProps {
    initialData?: Coupon;
    onClose: () => void;
}

export default function CouponForm({ initialData, onClose }: CouponFormProps) {
    const [formData, setFormData] = useState<CouponFormData>({
        code: initialData?.code || '',
        discount_type: initialData?.discount_type || 'percentage',
        discount_value: initialData?.discount_value || 0,
        min_order_amount: initialData?.min_order_amount || 0,
        start_date: initialData?.starts_at ? new Date(initialData.starts_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        end_date: initialData?.ends_at ? new Date(initialData.ends_at).toISOString().slice(0, 16) : '',
        usage_limit: initialData?.max_uses || null,
        is_active: initialData?.is_active ?? true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                ...formData,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
            };

            let result;
            if (initialData) {
                result = await updateCoupon(initialData.id, payload);
            } else {
                result = await createCoupon(payload);
            }

            if (result.error) {
                setError(result.error);
            } else {
                onClose();
            }
        } catch {
            setError('Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6">{initialData ? 'Edit Coupon' : 'Create New Coupon'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Coupon Code</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded p-2 uppercase"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. SUMMER20"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Discount Type</label>
                        <select
                            className="w-full border rounded p-2"
                            value={formData.discount_type}
                            onChange={e => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Value</label>
                        <input
                            type="number"
                            required
                            min="0"
                            className="w-full border rounded p-2"
                            value={formData.discount_value}
                            onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full border rounded p-2"
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full border rounded p-2"
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Min Order Amount</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full border rounded p-2"
                            value={formData.min_order_amount}
                            onChange={e => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Usage Limit (Optional)</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full border rounded p-2"
                            value={formData.usage_limit || ''}
                            onChange={e => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                            placeholder="Unlimited"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.is_active}
                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Coupon'}
                    </button>
                </div>
            </form>
        </div>
    );
}
