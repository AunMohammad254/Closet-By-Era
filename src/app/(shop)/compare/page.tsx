'use client';

import { useCompare } from '@/context/CompareContext';
import { getProductsByIds } from '@/actions/products';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AddToCompareButton from '@/components/product/AddToCompareButton';
import { useCart } from '@/context/CartContext';

// Type for products returned from getProductsByIds
interface CompareProduct {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    stock: number;
    images: string[] | null;
    is_active: boolean;
    in_stock: boolean | null;
    image?: string;
    category?: { name: string } | string;
    sizes?: string[] | null;
    colors?: { name: string }[] | null;
    description?: string | null;
    shortDescription?: string | null;
    features?: string[];
}

export default function ComparePage() {
    const { items, removeFromCompare } = useCompare();
    const [products, setProducts] = useState<CompareProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const { addItem } = useCart();

    useEffect(() => {
        const fetchDetails = async () => {
            if (items.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            try {
                const ids = items.map(i => i.id);
                const data = await getProductsByIds(ids);
                setProducts(data as CompareProduct[]);
            } catch (error) {
                console.error('Error fetching compare products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [items]);

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-16 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="min-h-screen pt-32 pb-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Compare Products</h1>
                    <p className="text-gray-500 mb-8">You haven't selected any products to compare.</p>
                    <Link href="/products" className="inline-block bg-slate-900 text-white px-8 py-3 rounded-full font-medium hover:bg-slate-800 transition-colors">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    const handleAddToCart = (product: CompareProduct) => {
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image || product.images?.[0] || '',
            quantity: 1,
            size: product.sizes?.[0] || '',
            color: product.colors?.[0]?.name || 'Default',
        });
        alert('Added to cart!');
    };

    return (
        <div className="min-h-screen pt-32 pb-16 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Compare Products</h1>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-200 border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 text-left w-48 bg-gray-50 border border-gray-100">Feature</th>
                                {products.map(product => (
                                    <th key={product.id} className="p-4 text-left w-64 border border-gray-100 align-top relative group">
                                        <button
                                            onClick={() => removeFromCompare(product.id)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                                            title="Remove"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <div className="relative aspect-3/4 bg-gray-100 rounded-lg overflow-hidden mb-4">
                                            {(product.images?.[0] || product.image) ? (
                                                <Image
                                                    src={product.images?.[0] || product.image || '/placeholder.png'}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <Link href={`/product/${product.slug}`} className="text-lg font-bold text-gray-900 hover:text-rose-600 block mb-2">
                                            {product.name}
                                        </Link>
                                        <p className="text-xl font-medium text-slate-900 mb-4">
                                            PKR {product.price.toLocaleString()}
                                        </p>
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                        >
                                            Add to Cart
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="p-4 font-medium text-gray-900 bg-gray-50 border border-gray-100">Category</td>
                                {products.map(product => (
                                    <td key={product.id} className="p-4 text-gray-600 border border-gray-100 capitalize">
                                        {typeof product.category === 'string' ? product.category : product.category?.name}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-900 bg-gray-50 border border-gray-100">Availability</td>
                                {products.map(product => (
                                    <td key={product.id} className="p-4 text-gray-600 border border-gray-100">
                                        {product.in_stock ? (
                                            <span className="text-emerald-600 font-medium">In Stock</span>
                                        ) : (
                                            <span className="text-red-500 font-medium">Out of Stock</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-900 bg-gray-50 border border-gray-100">Material</td>
                                {products.map(product => (
                                    <td key={product.id} className="p-4 text-gray-600 border border-gray-100">
                                        {/* Assuming description or specific field contains material, otherwise generic text */}
                                        {product.features?.find((f: string) => f.includes('Cotton') || f.includes('Fabric') || f.includes('Material')) || 'Standard Material'}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-900 bg-gray-50 border border-gray-100">Sizes</td>
                                {products.map(product => (
                                    <td key={product.id} className="p-4 text-gray-600 border border-gray-100">
                                        <div className="flex flex-wrap gap-1">
                                            {product.sizes?.map((size: string) => (
                                                <span key={size} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                    {size}
                                                </span>
                                            )) || '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-900 bg-gray-50 border border-gray-100">Description</td>
                                {products.map(product => (
                                    <td key={product.id} className="p-4 text-gray-600 border border-gray-100 text-sm leading-relaxed">
                                        {product.shortDescription || product.description?.substring(0, 100) + '...'}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
