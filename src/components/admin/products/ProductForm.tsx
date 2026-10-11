'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct } from '@/actions/products';
import type { ProductFormData } from '@/types/database';
import { Loader2, Save, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/admin/products/ImageUpload';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id?: string;
    name: string;
    description: string | null;
    price: number;
    original_price?: number | null;
    stock?: number | null;
    category_id: string | null;
    image_url?: string | null;
    images?: string[] | null;
    is_active?: boolean | null;
    is_featured: boolean | null;
    is_new: boolean | null;
    is_sale: boolean | null;
    sizes?: string[] | null;
    colors?: string[] | null;
}

interface Props {
    product?: Product; // If provided, it's edit mode
    categories: Category[];
}

/** "S, M , L,," -> ["S", "M", "L"] (trimmed, no blanks or repeats). */
function parseList(value: FormDataEntryValue | null): string[] {
    return [...new Set((value?.toString() ?? '').split(',').map(s => s.trim()).filter(Boolean))];
}

const inputClass = 'w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 transition-all font-medium text-gray-900 placeholder:text-gray-400';
const labelClass = 'block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-rose-600';

const TOGGLES = [
    { name: 'is_active', label: 'Visible in store', hint: 'Hidden products cannot be found or bought' },
    { name: 'is_featured', label: 'Featured', hint: 'Highlight on homepage' },
    { name: 'is_new', label: 'New Arrival', hint: 'Mark as new item' },
    { name: 'is_sale', label: 'On Sale', hint: 'Display sale badge' },
] as const;

export default function ProductForm({ product, categories }: Props) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // The form edits the main image; any further gallery images are kept as they are.
    const initialImage = product?.image_url || product?.images?.[0] || '';
    const [imageUrl, setImageUrl] = useState(initialImage);
    const otherImages = (product?.images ?? []).filter(u => u && u !== initialImage);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const form = new FormData(e.currentTarget);
        const originalPrice = form.get('original_price')?.toString().trim();

        const productData: ProductFormData = {
            name: form.get('name')?.toString().trim() || '',
            description: form.get('description')?.toString().trim() || '',
            price: parseFloat(form.get('price')?.toString() || '0'),
            original_price: originalPrice ? parseFloat(originalPrice) : null,
            stock: Number(form.get('stock')?.toString() || '0'),
            category_id: form.get('category_id')?.toString() || null,
            images: [imageUrl, ...otherImages.filter(u => u !== imageUrl)].filter(Boolean),
            is_active: form.get('is_active') === 'on',
            is_featured: form.get('is_featured') === 'on',
            is_new: form.get('is_new') === 'on',
            is_sale: form.get('is_sale') === 'on',
            sizes: parseList(form.get('sizes')),
            colors: parseList(form.get('colors')),
        };

        try {
            const result = product?.id
                ? await updateProduct(product.id, productData)
                : await createProduct(productData);

            if (!result.success) {
                setError(result.error || 'Something went wrong');
                setSubmitting(false);
                return;
            }
            toast.success(product?.id ? 'Product updated' : 'Product created');
            router.push('/admin/products');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
            setError(errorMessage);
            setSubmitting(false);
        }
    };

    const toggleDefault = (name: typeof TOGGLES[number]['name']) =>
        name === 'is_active' ? product?.is_active ?? true : Boolean(product?.[name]);

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
            {error && (
                <div role="alert" className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center animate-in fade-in slide-in-from-top-2">
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
                                <label htmlFor="product-name" className={labelClass}>Product Name</label>
                                <input
                                    id="product-name"
                                    type="text"
                                    name="name"
                                    defaultValue={product?.name}
                                    required
                                    maxLength={255}
                                    className={inputClass}
                                    placeholder="e.g. Silk Evening Dress"
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="product-description" className={labelClass}>Description</label>
                                <textarea
                                    id="product-description"
                                    name="description"
                                    defaultValue={product?.description ?? ''}
                                    rows={6}
                                    className={`${inputClass} font-normal resize-y`}
                                    placeholder="Describe the product features, material, and care instructions..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group">
                                    <label htmlFor="product-price" className={labelClass}>Price (PKR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs.</span>
                                        <input
                                            id="product-price"
                                            type="number"
                                            name="price"
                                            defaultValue={product?.price}
                                            required
                                            min="0.01"
                                            step="0.01"
                                            className={`${inputClass} pl-12`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label htmlFor="product-original-price" className={labelClass}>Original Price (optional)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs.</span>
                                        <input
                                            id="product-original-price"
                                            type="number"
                                            name="original_price"
                                            defaultValue={product?.original_price ?? ''}
                                            min="0.01"
                                            step="0.01"
                                            className={`${inputClass} pl-12`}
                                            placeholder="Shown struck through"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label htmlFor="product-stock" className={labelClass}>Stock</label>
                                    <input
                                        id="product-stock"
                                        type="number"
                                        name="stock"
                                        defaultValue={product?.stock ?? ''}
                                        required
                                        min="0"
                                        step="1"
                                        className={inputClass}
                                        placeholder="Units available"
                                    />
                                </div>
                                <div className="group">
                                    <label htmlFor="product-category" className={labelClass}>Category</label>
                                    <select
                                        id="product-category"
                                        name="category_id"
                                        defaultValue={product?.category_id ?? ''}
                                        required
                                        className={`${inputClass} font-normal appearance-none cursor-pointer`}
                                        style={{ backgroundImage: 'none' }}
                                    >
                                        <option value="">Select a Category</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="group">
                                    <label htmlFor="product-sizes" className={labelClass}>Sizes</label>
                                    <input
                                        id="product-sizes"
                                        type="text"
                                        name="sizes"
                                        defaultValue={product?.sizes?.join(', ') ?? ''}
                                        className={inputClass}
                                        placeholder="S, M, L, XL"
                                    />
                                </div>
                                <div className="group">
                                    <label htmlFor="product-colors" className={labelClass}>Colors</label>
                                    <input
                                        id="product-colors"
                                        type="text"
                                        name="colors"
                                        defaultValue={product?.colors?.join(', ') ?? ''}
                                        className={inputClass}
                                        placeholder="Black, Navy, Ivory"
                                    />
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
                            defaultValue={initialImage || undefined}
                            onUpload={(url) => setImageUrl(url)}
                        />
                        {otherImages.length > 0 && (
                            <p className="text-xs text-gray-500 mt-3">
                                {otherImages.length} more gallery image{otherImages.length === 1 ? '' : 's'} will be kept.
                            </p>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-5 bg-rose-500 rounded-full"></span>
                            Availability & Status
                        </h3>
                        <div className="space-y-2">
                            {TOGGLES.map(({ name, label, hint }) => (
                                <label key={name} className="flex items-center justify-between cursor-pointer group p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                    <div className="space-y-0.5">
                                        <span className="block text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">{label}</span>
                                        <span className="block text-xs text-gray-500">{hint}</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name={name} aria-label={label} defaultChecked={toggleDefault(name)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                                    </div>
                                </label>
                            ))}
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
