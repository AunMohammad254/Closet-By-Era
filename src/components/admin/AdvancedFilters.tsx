'use client';

import { useState, useEffect } from 'react';
import { getFilterPresets, createFilterPreset, deleteFilterPreset, setDefaultPreset } from '@/actions/filters';
import { SlidersHorizontal, Save, Trash2, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';

type FilterPreset = {
    id: string;
    name: string;
    filters: Record<string, any>;
    is_default: boolean;
};

interface AdvancedFiltersProps {
    entityType: 'orders' | 'products' | 'customers';
    currentFilters: Record<string, any>;
    onApplyFilters: (filters: Record<string, any>) => void;
    filterFields: {
        key: string;
        label: string;
        type: 'select' | 'text' | 'number' | 'date' | 'range';
        options?: { value: string; label: string }[];
    }[];
}

export default function AdvancedFilters({
    entityType,
    currentFilters,
    onApplyFilters,
    filterFields
}: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [presets, setPresets] = useState<FilterPreset[]>([]);
    const [filters, setFilters] = useState<Record<string, any>>(currentFilters);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [presetName, setPresetName] = useState('');

    useEffect(() => {
        loadPresets();
    }, [entityType]);

    const loadPresets = async () => {
        const result = await getFilterPresets(entityType);
        if (result.success && result.data) {
            setPresets(result.data);

            // Apply default preset
            const defaultPreset = result.data.find(p => p.is_default);
            if (defaultPreset) {
                setFilters(defaultPreset.filters);
                onApplyFilters(defaultPreset.filters);
            }
        }
    };

    const handleApply = () => {
        onApplyFilters(filters);
        setIsOpen(false);
    };

    const handleReset = () => {
        const emptyFilters: Record<string, any> = {};
        setFilters(emptyFilters);
        onApplyFilters(emptyFilters);
    };

    const handleSavePreset = async () => {
        if (!presetName.trim()) {
            toast.error('Please enter a preset name');
            return;
        }

        const result = await createFilterPreset({
            name: presetName,
            entity_type: entityType,
            filters,
            is_shared: false
        });

        if (result.success) {
            toast.success('Preset saved');
            setSaveModalOpen(false);
            setPresetName('');
            loadPresets();
        } else {
            toast.error(result.error || 'Failed to save preset');
        }
    };

    const handleLoadPreset = (preset: FilterPreset) => {
        setFilters(preset.filters);
        onApplyFilters(preset.filters);
        setIsOpen(false);
        toast.success(`Applied "${preset.name}"`);
    };

    const handleDeletePreset = async (presetId: string) => {
        const result = await deleteFilterPreset(presetId);
        if (result.success) {
            setPresets(prev => prev.filter(p => p.id !== presetId));
            toast.success('Preset deleted');
        }
    };

    const handleSetDefault = async (presetId: string) => {
        const result = await setDefaultPreset(presetId, entityType);
        if (result.success) {
            setPresets(prev => prev.map(p => ({ ...p, is_default: p.id === presetId })));
            toast.success('Default preset updated');
        }
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== undefined).length;

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-4 py-2.5 rounded-xl border transition-colors flex items-center gap-2 ${activeFilterCount > 0
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
                    }`}
            >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-rose-500 text-white rounded-full">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Filter Panel */}
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-96 bg-[#1e293b] rounded-xl border border-slate-700/50 shadow-xl z-50">
                    <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-200">Advanced Filters</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Saved Presets */}
                    {presets.length > 0 && (
                        <div className="p-3 border-b border-slate-700/50">
                            <p className="text-xs text-slate-500 mb-2">Saved Presets</p>
                            <div className="flex flex-wrap gap-2">
                                {presets.map(preset => (
                                    <div key={preset.id} className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleLoadPreset(preset)}
                                            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${preset.is_default
                                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                                    : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
                                                }`}
                                        >
                                            {preset.is_default && <Star className="w-3 h-3 inline mr-1" />}
                                            {preset.name}
                                        </button>
                                        <button
                                            onClick={() => handleSetDefault(preset.id)}
                                            className="p-1 text-slate-500 hover:text-amber-400"
                                            title="Set as default"
                                        >
                                            <Star className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePreset(preset.id)}
                                            className="p-1 text-slate-500 hover:text-rose-400"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter Fields */}
                    <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                        {filterFields.map(field => (
                            <div key={field.key}>
                                <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
                                {field.type === 'select' && (
                                    <select
                                        value={filters[field.key] || ''}
                                        onChange={e => setFilters({ ...filters, [field.key]: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200"
                                    >
                                        <option value="">All</option>
                                        {field.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                )}
                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        value={filters[field.key] || ''}
                                        onChange={e => setFilters({ ...filters, [field.key]: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200"
                                        placeholder={`Search ${field.label.toLowerCase()}...`}
                                    />
                                )}
                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        value={filters[field.key] || ''}
                                        onChange={e => setFilters({ ...filters, [field.key]: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200"
                                    />
                                )}
                                {field.type === 'date' && (
                                    <input
                                        type="date"
                                        value={filters[field.key] || ''}
                                        onChange={e => setFilters({ ...filters, [field.key]: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200"
                                    />
                                )}
                                {field.type === 'range' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters[`${field.key}_min`] || ''}
                                            onChange={e => setFilters({ ...filters, [`${field.key}_min`]: e.target.value })}
                                            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters[`${field.key}_max`] || ''}
                                            onChange={e => setFilters({ ...filters, [`${field.key}_max`]: e.target.value })}
                                            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-slate-700/50 flex justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={handleReset}
                                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setSaveModalOpen(true)}
                                className="px-3 py-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                <Save className="w-3 h-3" />
                                Save
                            </button>
                        </div>
                        <button
                            onClick={handleApply}
                            className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Save Preset Modal */}
            {saveModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 p-6 w-80">
                        <h3 className="font-semibold text-slate-200 mb-4">Save Filter Preset</h3>
                        <input
                            type="text"
                            value={presetName}
                            onChange={e => setPresetName(e.target.value)}
                            placeholder="Preset name..."
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setSaveModalOpen(false)} className="px-4 py-2 text-slate-400">
                                Cancel
                            </button>
                            <button onClick={handleSavePreset} className="px-4 py-2 bg-rose-500 text-white rounded-lg">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
