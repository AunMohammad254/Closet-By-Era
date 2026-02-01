'use client';

import { useState, useEffect } from 'react';
import { getShippingZones, createShippingZone, deleteShippingZone, createShippingRate } from '@/actions/shipping';
import { Truck, Plus, Trash2, Loader2, X, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

type ShippingZone = {
    id: string;
    name: string;
    countries: string[];
    is_active: boolean;
    rates?: { id: string; name: string; rate: number; min_order_amount: number; max_order_amount: number | null; estimated_days: string | null }[];
};

export default function ShippingPage() {
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [showRateModal, setShowRateModal] = useState<string | null>(null);

    // Zone form
    const [zoneName, setZoneName] = useState('');
    const [zoneCountries, setZoneCountries] = useState('');

    // Rate form
    const [rateName, setRateName] = useState('');
    const [rateValue, setRateValue] = useState('');
    const [rateMinOrder, setRateMinOrder] = useState('0');
    const [rateMaxOrder, setRateMaxOrder] = useState('');
    const [rateEstDays, setRateEstDays] = useState('');

    const fetchZones = async () => {
        setLoading(true);
        const result = await getShippingZones();
        if (result.success && result.data) {
            setZones(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const handleCreateZone = async () => {
        if (!zoneName.trim()) {
            toast.error('Zone name is required');
            return;
        }

        const countries = zoneCountries.split(',').map(c => c.trim()).filter(Boolean);
        const result = await createShippingZone({ name: zoneName, countries });

        if (result.success) {
            toast.success('Shipping zone created');
            setShowZoneModal(false);
            setZoneName('');
            setZoneCountries('');
            fetchZones();
        } else {
            toast.error(result.error || 'Failed to create zone');
        }
    };

    const handleCreateRate = async () => {
        if (!showRateModal || !rateName.trim() || !rateValue) {
            toast.error('Rate name and value are required');
            return;
        }

        const result = await createShippingRate({
            zone_id: showRateModal,
            name: rateName,
            rate: parseFloat(rateValue),
            min_order_amount: parseFloat(rateMinOrder) || 0,
            max_order_amount: rateMaxOrder ? parseFloat(rateMaxOrder) : undefined,
            estimated_days: rateEstDays || undefined
        });

        if (result.success) {
            toast.success('Shipping rate added');
            setShowRateModal(null);
            setRateName('');
            setRateValue('');
            setRateMinOrder('0');
            setRateMaxOrder('');
            setRateEstDays('');
            fetchZones();
        } else {
            toast.error(result.error || 'Failed to add rate');
        }
    };

    const handleDeleteZone = async (zoneId: string) => {
        if (!confirm('Delete this zone and all its rates?')) return;

        const result = await deleteShippingZone(zoneId);
        if (result.success) {
            toast.success('Zone deleted');
            fetchZones();
        } else {
            toast.error(result.error || 'Failed to delete zone');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Shipping Zones</h1>
                    <p className="text-slate-400 text-sm mt-1">Configure shipping zones and rates</p>
                </div>
                <button
                    onClick={() => setShowZoneModal(true)}
                    className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Zone
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-rose-500" />
                </div>
            ) : zones.length === 0 ? (
                <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-12 text-center">
                    <Truck className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-400">No shipping zones configured</p>
                    <button
                        onClick={() => setShowZoneModal(true)}
                        className="mt-4 px-4 py-2 text-rose-400 hover:text-rose-300"
                    >
                        Add your first zone
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {zones.map(zone => (
                        <div key={zone.id} className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Globe className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-200">{zone.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            {zone.countries.length > 0 ? zone.countries.join(', ') : 'All countries'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowRateModal(zone.id)}
                                        className="px-3 py-1.5 text-xs bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                                    >
                                        Add Rate
                                    </button>
                                    <button
                                        onClick={() => handleDeleteZone(zone.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {zone.rates && zone.rates.length > 0 && (
                                <div className="px-6 py-3">
                                    <table className="w-full text-sm">
                                        <thead className="text-slate-500">
                                            <tr>
                                                <th className="text-left py-2">Rate Name</th>
                                                <th className="text-left py-2">Min Order</th>
                                                <th className="text-left py-2">Max Order</th>
                                                <th className="text-left py-2">Price</th>
                                                <th className="text-left py-2">Est. Days</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-300">
                                            {zone.rates.map(rate => (
                                                <tr key={rate.id} className="border-t border-slate-700/30">
                                                    <td className="py-2">{rate.name}</td>
                                                    <td className="py-2">Rs. {rate.min_order_amount}</td>
                                                    <td className="py-2">{rate.max_order_amount ? `Rs. ${rate.max_order_amount}` : '∞'}</td>
                                                    <td className="py-2 font-medium text-emerald-400">Rs. {rate.rate}</td>
                                                    <td className="py-2">{rate.estimated_days || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Zone Modal */}
            {showZoneModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-200">New Shipping Zone</h3>
                            <button onClick={() => setShowZoneModal(false)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Zone Name</label>
                                <input
                                    type="text"
                                    value={zoneName}
                                    onChange={e => setZoneName(e.target.value)}
                                    placeholder="e.g., Pakistan"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Countries (comma-separated)</label>
                                <input
                                    type="text"
                                    value={zoneCountries}
                                    onChange={e => setZoneCountries(e.target.value)}
                                    placeholder="e.g., Pakistan, India, Bangladesh"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                />
                                <p className="text-xs text-slate-500 mt-1">Leave empty for all countries</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
                            <button onClick={() => setShowZoneModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200">
                                Cancel
                            </button>
                            <button onClick={handleCreateZone} className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600">
                                Create Zone
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rate Modal */}
            {showRateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-200">Add Shipping Rate</h3>
                            <button onClick={() => setShowRateModal(null)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Rate Name</label>
                                <input
                                    type="text"
                                    value={rateName}
                                    onChange={e => setRateName(e.target.value)}
                                    placeholder="e.g., Standard Shipping"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Min Order (Rs.)</label>
                                    <input
                                        type="number"
                                        value={rateMinOrder}
                                        onChange={e => setRateMinOrder(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Max Order (Rs.)</label>
                                    <input
                                        type="number"
                                        value={rateMaxOrder}
                                        onChange={e => setRateMaxOrder(e.target.value)}
                                        placeholder="Leave empty for no limit"
                                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Shipping Rate (Rs.)</label>
                                    <input
                                        type="number"
                                        value={rateValue}
                                        onChange={e => setRateValue(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Est. Days</label>
                                    <input
                                        type="text"
                                        value={rateEstDays}
                                        onChange={e => setRateEstDays(e.target.value)}
                                        placeholder="e.g., 3-5 days"
                                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
                            <button onClick={() => setShowRateModal(null)} className="px-4 py-2 text-slate-400 hover:text-slate-200">
                                Cancel
                            </button>
                            <button onClick={handleCreateRate} className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600">
                                Add Rate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
