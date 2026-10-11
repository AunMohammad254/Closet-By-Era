'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProductsByIds } from '@/actions/products';
import { canOptimizeImage, isDisplayableImage } from '@/lib/imageUtils';

type RecentProduct = Awaited<ReturnType<typeof getProductsByIds>>[number];

const imageOf = (p: RecentProduct) => p.image_url || p.images?.[0] || '/products/placeholder.png';

/** Products from localStorage "recently_viewed", newest first, without `excludeId` (the page's own product). */
export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState<RecentProduct[]>([]);

    useEffect(() => {
        let cancelled = false;
        const fetchRecent = async () => {
            try {
                const stored = localStorage.getItem('recently_viewed');
                const ids: unknown = stored ? JSON.parse(stored) : [];
                if (!Array.isArray(ids)) return;
                const recentIds = ids.filter((id): id is string => typeof id === 'string' && id !== excludeId).slice(0, 4);
                if (recentIds.length === 0) return;
                const data = await getProductsByIds(recentIds);
                if (!cancelled) setProducts(data);
            } catch (err) {
                console.error('Error loading recently viewed:', err);
            }
        };
        fetchRecent();
        return () => { cancelled = true; };
    }, [excludeId]);

    if (products.length === 0) return null;

    return (
        <section className="py-12 border-t border-border" aria-labelledby="recently-viewed-heading">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 id="recently-viewed-heading" className="text-xl font-bold text-foreground mb-6">Recently Viewed</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {products.map((product) => {
                        const image = imageOf(product);
                        return (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug ?? product.id}`}
                                className="group block"
                            >
                                <div className="relative aspect-3/4 bg-muted rounded-lg overflow-hidden mb-3">
                                    {isDisplayableImage(image) && (
                                        <Image
                                            src={image}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            unoptimized={!canOptimizeImage(image)}
                                        />
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                    {product.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {formatPrice(product.price)}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
