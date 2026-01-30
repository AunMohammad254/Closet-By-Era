'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Loader2, CheckSquare, Square, X } from 'lucide-react';
import { deleteProduct, bulkDeleteProducts } from '@/actions/products';
import { useState } from 'react';

interface Product {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    category?: { name: string };
    in_stock: boolean;
    is_featured: boolean;
}

export default function ProductsTable({ products }: { products: Product[] }) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        setDeletingId(id);
        try {
            await deleteProduct(id);
        } catch (error) {
            alert('Failed to delete product');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(products.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(pId => pId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;

        setIsBulkDeleting(true);
        try {
            await bulkDeleteProducts(selectedIds);
            setSelectedIds([]); // Clear selection on success
        } catch (error) {
            alert('Failed to delete products');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const isAllSelected = products.length > 0 && selectedIds.length === products.length;

    return (
        <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden relative">

            {/* Bulk Actions Header */}
            {selectedIds.length > 0 && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-rose-500 text-white p-4 flex items-center justify-between animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-3">
                        <span className="font-bold">{selectedIds.length} Selected</span>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-white/80 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="bg-white text-rose-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-rose-50 transition-colors flex items-center gap-2 disabled:opacity-70"
                        >
                            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 w-12">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-rose-500 focus:ring-rose-500/20 focus:ring-offset-0"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                    />
                                </div>
                            </th>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-2xl">📦</span>
                                        <span>No products found.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className={`hover:bg-slate-800/30 transition-colors group ${selectedIds.includes(product.id) ? 'bg-slate-800/40' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-rose-500 focus:ring-rose-500/20 focus:ring-offset-0"
                                                checked={selectedIds.includes(product.id)}
                                                onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-slate-700/50 relative overflow-hidden flex-shrink-0 group-hover:ring-2 ring-rose-500/30 transition-all">
                                                {product.image_url ? (
                                                    <Image
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                        📷
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">{product.name}</div>
                                                {product.is_featured && (
                                                    <span className="text-xs text-rose-400">⭐ Featured</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {product.category?.name || 'Uncategorized'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-200">
                                        PKR {product.price.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.in_stock ? (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                In Stock
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                Out of Stock
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/products/${product.id}`}
                                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                disabled={deletingId === product.id}
                                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {deletingId === product.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
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
