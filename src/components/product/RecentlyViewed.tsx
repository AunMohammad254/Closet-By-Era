'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProductsByIds } from '@/actions/products';

export default function RecentlyViewed() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const stored = localStorage.getItem('recently_viewed');
                if (!stored) {
                    setIsLoading(false);
                    return;
                }

                const ids = JSON.parse(stored);
                if (!Array.isArray(ids) || ids.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Take max 4 items
                const recentIds = ids.slice(0, 4);
                const data = await getProductsByIds(recentIds);

                // Filter out current product if on a product page? 
                // Using props to exclude current id might be better, but for now just show all.

                setProducts(data);
            } catch (err) {
                console.error('Error loading recently viewed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecent();
    }, []);

    if (isLoading || products.length === 0) return null;

    return (
        <section className="py-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recently Viewed</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {products.filter(p => {
                        const img = p.images?.[0] || p.image;
                        return typeof img === 'string' && img.trim().length > 0;
                    }).map((product) => (
                        <Link
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="group block"
                        >
                            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                                <Image
                                    src={product.images?.[0] || product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                                {product.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                PKR {product.price.toLocaleString()}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
