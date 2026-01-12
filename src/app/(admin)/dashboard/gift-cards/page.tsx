'use client';

import { useState, useEffect } from 'react';
import { getGiftCards, createGiftCard, deactivateGiftCard, GiftCard } from '@/actions/gift-cards';

export default function GiftCardsPage() {
    const [cards, setCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newValue, setNewValue] = useState(1000);
    const [newCode, setNewCode] = useState('');

    const fetchCards = async () => {
        setLoading(true);
        const data = await getGiftCards();
        setCards(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCards();
    }, []);

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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
            </div>

            {/* Create Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value (PKR)</label>
                    <input
                        type="number"
                        value={newValue}
                        onChange={(e) => setNewValue(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Code (Optional)</label>
                    <input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="Auto-generate"
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {isCreating ? 'Creating...' : 'Create Gift Card'}
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance / Initial</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : cards.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No gift cards found
                                </td>
                            </tr>
                        ) : (
                            cards.map((card) => (
                                <tr key={card.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-gray-900">
                                        {card.code}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        PKR {card.balance.toLocaleString()} / {card.initial_value.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(card.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${card.is_active && (card.balance > 0)
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {card.is_active && (card.balance > 0) ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {card.is_active && (
                                            <button
                                                onClick={() => handleDeactivate(card.id)}
                                                className="text-rose-600 hover:text-rose-900 font-medium"
                                            >
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
