'use client';

import { useState, useEffect } from 'react';
import { getPromotions, createPromotion, togglePromotion, deletePromotion } from '@/actions/promotions';
import { Zap, Plus, Trash2, Loader2, X, ToggleLeft, ToggleRight, Clock, Gift, Package } from 'lucide-react';
import toast from 'react-hot-toast';

type Promotion = {
    id: string;
    name: string;
    type: 'flash_sale' | 'bundle' | 'bogo';
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
};

const typeIcons = {
    flash_sale: Zap,
    bundle: Package,
    bogo: Gift
};

const typeColors = {
    flash_sale: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    bundle: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bogo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

export default function PromotionsPage() {
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [name, setName] = useState('');
    const [type, setType] = useState<'flash_sale' | 'bundle' | 'bogo'>('flash_sale');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');

    const fetchPromos = async () => {
        setLoading(true);
        const result = await getPromotions();
        if (result.success && result.data) {
            setPromos(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const handleCreate = async () => {
        if (!name.trim() || !discountValue || !startsAt || !endsAt) {
            toast.error('All fields are required');
            return;
        }

        const result = await createPromotion({
            name,
            type,
            discount_type: discountType,
            discount_value: parseFloat(discountValue),
            starts_at: new Date(startsAt).toISOString(),
            ends_at: new Date(endsAt).toISOString()
        });

        if (result.success) {
            toast.success('Promotion created');
            setShowModal(false);
            setName('');
            setDiscountValue('');
            setStartsAt('');
            setEndsAt('');
            fetchPromos();
        } else {
            toast.error(result.error || 'Failed to create promotion');
        }
    };

    const handleToggle = async (promoId: string, currentActive: boolean) => {
        const result = await togglePromotion(promoId, !currentActive);
        if (result.success) {
            setPromos(prev => prev.map(p => p.id === promoId ? { ...p, is_active: !currentActive } : p));
        } else {
            toast.error('Failed to toggle promotion');
        }
    };

    const handleDelete = async (promoId: string) => {
        if (!confirm('Delete this promotion?')) return;

        const result = await deletePromotion(promoId);
        if (result.success) {
            toast.success('Promotion deleted');
            fetchPromos();
        } else {
            toast.error(result.error || 'Failed to delete');
        }
    };

    const isExpired = (endDate: string) => new Date(endDate) < new Date();
    const isUpcoming = (startDate: string) => new Date(startDate) > new Date();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Promotions</h1>
                    <p className="text-slate-400 text-sm mt-1">Flash sales, bundles, and special offers</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Promotion
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
                </div>
            ) : promos.length === 0 ? (
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-12 text-center">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-400">No promotions configured</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 px-4 py-2 text-rose-400 hover:text-rose-300"
                    >
                        Create your first promotion
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {promos.map(promo => {
                        const TypeIcon = typeIcons[promo.type];
                        const expired = isExpired(promo.ends_at);
                        const upcoming = isUpcoming(promo.starts_at);

                        return (
                            <div
                                key={promo.id}
                                className={`bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden ${expired ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="px-5 py-4 border-b border-slate-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${typeColors[promo.type]}`}>
                                            <TypeIcon className="w-3 h-3" />
                                            {promo.type.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <button
                                            onClick={() => handleToggle(promo.id, promo.is_active)}
                                            className={`p-1 rounded transition-colors ${promo.is_active ? 'text-emerald-400' : 'text-slate-500'
                                                }`}
                                        >
                                            {promo.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                        </button>
                                    </div>
                                    <h3 className="font-semibold text-slate-200 text-lg">{promo.name}</h3>
                                    <p className="text-2xl font-bold text-rose-400 mt-1">
                                        {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `Rs. ${promo.discount_value} OFF`}
                                    </p>
                                </div>
                                <div className="px-5 py-3 flex items-center justify-between">
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {upcoming ? (
                                            <span className="text-blue-400">Starts {new Date(promo.starts_at).toLocaleDateString()}</span>
                                        ) : expired ? (
                                            <span className="text-slate-500">Ended {new Date(promo.ends_at).toLocaleDateString()}</span>
                                        ) : (
                                            <span className="text-emerald-400">Ends {new Date(promo.ends_at).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(promo.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-200">New Promotion</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Promotion Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g., Summer Flash Sale"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value as 'flash_sale' | 'bundle' | 'bogo')}
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                >
                                    <option value="flash_sale">Flash Sale</option>
                                    <option value="bundle">Bundle Deal</option>
                                    <option value="bogo">Buy One Get One</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Discount Type</label>
                                    <select
                                        value={discountType}
                                        onChange={e => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (Rs.)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Value</label>
                                    <input
                                        type="number"
                                        value={discountValue}
                                        onChange={e => setDiscountValue(e.target.value)}
                                        placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
                                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Starts At</label>
                                    <input
                                        type="datetime-local"
                                        value={startsAt}
                                        onChange={e => setStartsAt(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Ends At</label>
                                    <input
                                        type="datetime-local"
                                        value={endsAt}
                                        onChange={e => setEndsAt(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200">
                                Cancel
                            </button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600">
                                Create Promotion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
