'use client';

import { useState } from 'react';
import { createProduct, updateProduct } from '@/actions/products';
import type { ProductFormData } from '@/types/database';
import { Loader2, Save, X } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/products/ImageUpload';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id?: string;
    name: string;
    description: string;
    price: number;
    category_id: string;
    image_url?: string;
    is_featured: boolean;
    is_new: boolean;
    is_sale: boolean;
}

interface Props {
    product?: Product; // If provided, it's edit mode
    categories: Category[];
}

export default function ProductForm({ product, categories }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState(product?.image_url || '');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const form = e.currentTarget;
        const formElements = new FormData(form);

        // Convert FormData to ProductFormData
        const productData: ProductFormData = {
            name: formElements.get('name')?.toString() || '',
            description: formElements.get('description')?.toString() || '',
            price: parseFloat(formElements.get('price')?.toString() || '0'),
            stock: parseInt(formElements.get('stock')?.toString() || '10'),
            category: formElements.get('category_id')?.toString() || '',
            images: imageUrl ? [imageUrl] : [],
            is_active: true,
        };

        try {
            const result = product?.id
                ? await updateProduct(product.id, productData)
                : await createProduct(productData);

            if (!result.success) {
                setError(result.error || 'Something went wrong');
                setSubmitting(false);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
            setError(errorMessage);
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center animate-in fade-in slide-in-from-top-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-5 mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-rose-500 rounded-full"></span>
                            Product Details
                        </h3>

                        <div className="space-y-6">
                            <div className="group">
                                <label className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-rose-600">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    defaultValue={product?.name}
                                    required
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholder="e.g. Silk Evening Dress"
                                />
                            </div>

                            <div className="group">
                                <label className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-rose-600">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    defaultValue={product?.description}
                                    rows={6}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all text-gray-900 placeholder:text-gray-400 resize-y"
                                    placeholder="Describe the product features, material, and care instructions..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-rose-600">
                                        Price (PKR)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs.</span>
                                        <input
                                            type="number"
                                            name="price"
                                            defaultValue={product?.price}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full pl-12 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-rose-600">
                                        Category
                                    </label>
                                    <select
                                        name="category_id"
                                        defaultValue={product?.category_id}
                                        required
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all text-gray-900 appearance-none cursor-pointer"
                                        style={{ backgroundImage: 'none' }}
                                    >
                                        <option value="">Select a Category</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Custom Chevron override if needed, but standard select is usually fine with custom CSS styling */}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-5 mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-rose-500 rounded-full"></span>
                            Media
                        </h3>
                        <ImageUpload
                            defaultValue={product?.image_url}
                            onUpload={(url) => setImageUrl(url)}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-5 bg-rose-500 rounded-full"></span>
                            Availability & Status
                        </h3>
                        <div className="space-y-5">
                            <label className="flex items-center justify-between cursor-pointer group p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <div className="space-y-0.5">
                                    <span className="block text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">Featured</span>
                                    <span className="block text-xs text-gray-500">Highlight on homepage</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                                </div>
                            </label>

                            <div className="h-px bg-gray-50"></div>

                            <label className="flex items-center justify-between cursor-pointer group p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <div className="space-y-0.5">
                                    <span className="block text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">New Arrival</span>
                                    <span className="block text-xs text-gray-500">Mark as new item</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="is_new" defaultChecked={product?.is_new} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                                </div>
                            </label>

                            <div className="h-px bg-gray-50"></div>

                            <label className="flex items-center justify-between cursor-pointer group p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <div className="space-y-0.5">
                                    <span className="block text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">On Sale</span>
                                    <span className="block text-xs text-gray-500">Display sale badge</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="is_sale" defaultChecked={product?.is_sale} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-6 py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-rose-700 hover:to-rose-600 shadow-lg shadow-rose-200 focus:ring-4 focus:ring-rose-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Save Product
                        </button>
                        <Link
                            href="/admin/products"
                            className="w-full px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 flex items-center justify-center gap-2 transition-all"
                        >
                            <X className="w-5 h-5" />
                            Cancel
                        </Link>
                    </div>
                </div>
            </div>
        </form>
    );
}
