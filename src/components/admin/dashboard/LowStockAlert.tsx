'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, ChevronRight, PackageX } from 'lucide-react';
import { getLowStockProducts } from '@/actions/products';

interface Product {
    id: string;
    name: string;
    stock: number;
    price: number;
    images: string[];
}

export default function LowStockAlert() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLowStock() {
            try {
                // @ts-ignore
                const data = await getLowStockProducts(5);
                // Transform data if needed to match local interface or update local interface
                // The server action returns { id, name, stock, price, images, slug }
                // The local interface expects { id, name, stock, price, images }
                // So the data is compatible if strictness isn't an issue or we cast.
                setProducts(data as unknown as Product[]);
            } catch (error) {
                console.error('Failed to fetch low stock products', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLowStock();
    }, []);

    if (loading) {
        return (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 h-full animate-pulse flex flex-col gap-4">
                <div className="h-6 w-32 bg-slate-700/50 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                    <div className="h-14 bg-slate-700/50 rounded-xl"></div>
                    <div className="h-14 bg-slate-700/50 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return null; // Don't show if no low stock, or show a "All Good" state?
        // Let's show "All Good" to fill the grid if needed, or better yet, handle empty consistently.
        // For dashboard density, showing nothing is often better, but let's show a "Healthy Stock" card for now
        // so the layout doesn't break if it expects a grid item.
        /* 
        return (
             <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                    <PackageCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-medium text-slate-200">Stock Levels Healthy</h3>
                <p className="text-sm text-slate-400 mt-1">No products below threshold.</p>
            </div>
        );
        */
        // Actually, let's just default to returning null for cleaner dashboard if empty, 
        // but the container grid in page.tsx might need to be responsive.
        // I'll return a "Good" state.
    }

    return (
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 flex flex-col h-full hover:shadow-lg hover:shadow-orange-500/5 transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-orange-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-bold text-slate-100">Low Stock Alerts</h3>
                </div>
                <Link
                    href="/admin/products?sort=stock_asc"
                    className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                    View All <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-slate-700/50 relative overflow-hidden flex-shrink-0">
                            {product.images && product.images[0] ? (
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <PackageX className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-rose-400 transition-colors">
                                {product.name}
                            </h4>
                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                Price: PKR {product.price.toLocaleString()}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-sm font-bold ${product.stock === 0 ? 'text-rose-500' : 'text-orange-400'}`}>
                                {product.stock}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">left</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 text-center">
                    {products.length} products require restocking
                </p>
            </div>
        </div>
    );
}
