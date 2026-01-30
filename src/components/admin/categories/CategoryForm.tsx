'use client';

import { useState } from 'react';
import { createCategory, updateCategory, type CategoryFormData } from '@/actions/categories';
import { Loader2, Save, X } from 'lucide-react';

interface CategoryFormProps {
    category?: {
        id: string;
        name: string;
        description?: string;
        display_order?: number;
        is_active?: boolean;
    } | null;
    onClose: () => void;
}

export default function CategoryForm({ category, onClose }: CategoryFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data: CategoryFormData = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            display_order: parseInt(formData.get('display_order') as string) || 0,
            is_active: formData.get('is_active') === 'on',
        };

        try {
            const result = category
                ? await updateCategory(category.id, data)
                : await createCategory(data);

            if (result.success) {
                onClose();
            } else {
                setError(result.error || 'Failed to save category');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700/50 overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-slate-100">
                        {category ? 'Edit Category' : 'Add New Category'}
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
                                Category Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                defaultValue={category?.name}
                                required
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-500"
                                placeholder="e.g. Dresses"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                defaultValue={category?.description}
                                rows={3}
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all resize-none placeholder:text-slate-500"
                                placeholder="Optional description..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Display Order
                                </label>
                                <input
                                    type="number"
                                    name="display_order"
                                    defaultValue={category?.display_order || 0}
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="flex items-center pt-7">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className="relative inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            defaultChecked={category?.is_active ?? true}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 peer-checked:after:bg-white"></div>
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">Active</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
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
                            Save Category
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
