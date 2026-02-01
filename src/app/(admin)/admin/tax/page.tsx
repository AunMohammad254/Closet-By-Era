'use client';

import { useState, useEffect } from 'react';
import { getTaxRules, createTaxRule, toggleTaxRule, deleteTaxRule } from '@/actions/tax';
import { Receipt, Plus, Trash2, Loader2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

type TaxRule = {
    id: string;
    name: string;
    region: string | null;
    rate: number;
    applies_to: 'all' | 'products' | 'shipping';
    is_active: boolean;
};

export default function TaxPage() {
    const [rules, setRules] = useState<TaxRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [name, setName] = useState('');
    const [region, setRegion] = useState('');
    const [rate, setRate] = useState('');
    const [appliesTo, setAppliesTo] = useState<'all' | 'products' | 'shipping'>('all');

    const fetchRules = async () => {
        setLoading(true);
        const result = await getTaxRules();
        if (result.success && result.data) {
            setRules(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleCreate = async () => {
        if (!name.trim() || !rate) {
            toast.error('Name and rate are required');
            return;
        }

        const result = await createTaxRule({
            name,
            region: region || undefined,
            rate: parseFloat(rate),
            applies_to: appliesTo
        });

        if (result.success) {
            toast.success('Tax rule created');
            setShowModal(false);
            setName('');
            setRegion('');
            setRate('');
            setAppliesTo('all');
            fetchRules();
        } else {
            toast.error(result.error || 'Failed to create rule');
        }
    };

    const handleToggle = async (ruleId: string, currentActive: boolean) => {
        const result = await toggleTaxRule(ruleId, !currentActive);
        if (result.success) {
            setRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: !currentActive } : r));
        } else {
            toast.error('Failed to toggle rule');
        }
    };

    const handleDelete = async (ruleId: string) => {
        if (!confirm('Delete this tax rule?')) return;

        const result = await deleteTaxRule(ruleId);
        if (result.success) {
            toast.success('Tax rule deleted');
            fetchRules();
        } else {
            toast.error(result.error || 'Failed to delete rule');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Tax Configuration</h1>
                    <p className="text-slate-400 text-sm mt-1">Configure tax rates for your store</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Rule
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
                </div>
            ) : rules.length === 0 ? (
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-12 text-center">
                    <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-400">No tax rules configured</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 px-4 py-2 text-rose-400 hover:text-rose-300"
                    >
                        Add your first rule
                    </button>
                </div>
            ) : (
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 text-left">Name</th>
                                <th className="px-6 py-4 text-left">Region</th>
                                <th className="px-6 py-4 text-left">Rate</th>
                                <th className="px-6 py-4 text-left">Applies To</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {rules.map(rule => (
                                <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200">{rule.name}</td>
                                    <td className="px-6 py-4 text-slate-400">{rule.region || 'Global'}</td>
                                    <td className="px-6 py-4 text-emerald-400 font-medium">{rule.rate}%</td>
                                    <td className="px-6 py-4 text-slate-400 capitalize">{rule.applies_to}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggle(rule.id, rule.is_active)}
                                            className={`p-1 rounded transition-colors ${rule.is_active ? 'text-emerald-400' : 'text-slate-500'
                                                }`}
                                        >
                                            {rule.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-200">New Tax Rule</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g., GST"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Region (optional)</label>
                                <input
                                    type="text"
                                    value={region}
                                    onChange={e => setRegion(e.target.value)}
                                    placeholder="e.g., Punjab (leave empty for all)"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Rate (%)</label>
                                <input
                                    type="number"
                                    value={rate}
                                    onChange={e => setRate(e.target.value)}
                                    placeholder="e.g., 17"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Applies To</label>
                                <select
                                    value={appliesTo}
                                    onChange={e => setAppliesTo(e.target.value as 'all' | 'products' | 'shipping')}
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                >
                                    <option value="all">All (Products + Shipping)</option>
                                    <option value="products">Products Only</option>
                                    <option value="shipping">Shipping Only</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200">
                                Cancel
                            </button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600">
                                Create Rule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
