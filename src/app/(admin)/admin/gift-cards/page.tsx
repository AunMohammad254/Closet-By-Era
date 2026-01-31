'use client';

import { useState, useEffect, useCallback } from 'react';
import { getGiftCards, createGiftCard, deactivateGiftCard, GiftCard } from '@/actions/gift-cards';
import { Plus, Loader2, Gift, XCircle } from 'lucide-react';

export default function GiftCardsPage() {
    const [cards, setCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newValue, setNewValue] = useState(1000);
    const [newCode, setNewCode] = useState('');

    const fetchCards = useCallback(async () => {
        setLoading(true);
        const data = await getGiftCards();
        setCards(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const handleCreate = async () => {
        if (!newValue) return;
        setIsCreating(true);
        const res = await createGiftCard({
            code: newCode || undefined,
            initial_value: Number(newValue)
        });

        if (res.success) {
            setNewCode('');
            setNewValue(1000);
            await fetchCards();
        } else {
            alert('Error: ' + res.error);
        }
        setIsCreating(false);
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        await deactivateGiftCard(id);
        await fetchCards();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Gift Cards</h1>
                <p className="text-slate-400 text-sm mt-1">Create and manage gift cards for your customers.</p>
            </div>

            {/* Create Card Form */}
            <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-rose-400" />
                    Create New Gift Card
                </h2>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Value (PKR)</label>
                        <input
                            type="number"
                            value={newValue}
                            onChange={(e) => setNewValue(Number(e.target.value))}
                            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all w-40"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Custom Code (Optional)</label>
                        <input
                            type="text"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            placeholder="Auto-generate"
                            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all placeholder:text-slate-500 w-48"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 disabled:opacity-50"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Gift className="w-4 h-4 mr-2" />
                                Create Gift Card
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Gift Cards Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-700/50">
                    <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance / Initial</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" />
                                    <p className="text-slate-500 mt-2">Loading gift cards...</p>
                                </td>
                            </tr>
                        ) : cards.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <Gift className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                    <p className="text-slate-500">No gift cards found</p>
                                    <p className="text-slate-600 text-sm">Create your first gift card above</p>
                                </td>
                            </tr>
                        ) : (
                            cards.map((card) => (
                                <tr key={card.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono font-medium text-slate-200 bg-slate-800/50 px-3 py-1 rounded-lg">
                                            {card.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                                        <span className="font-semibold text-slate-200">PKR {card.balance.toLocaleString()}</span>
                                        <span className="text-slate-500"> / {card.initial_value.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {new Date(card.created_at).toLocaleDateString('en-PK', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${card.is_active && (card.balance > 0)
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${card.is_active && (card.balance > 0) ? 'bg-emerald-400' : 'bg-slate-500'
                                                }`} />
                                            {card.is_active && (card.balance > 0) ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {card.is_active && (
                                            <button
                                                onClick={() => handleDeactivate(card.id)}
                                                className="inline-flex items-center text-sm text-rose-400 hover:text-rose-300 font-medium transition-colors"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Deactivate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
