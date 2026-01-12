'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: string;
    category_id: string;
    image: string;
    createdAt: Date;
    in_stock: boolean;
    is_featured: boolean;
    isNew?: boolean;
    isSale?: boolean;
}

export default function FeaturedProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeaturedProducts() {
            try {
                // Fetch featured products from Supabase
                const { data: productsData, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        categories (
                            name
                        )
                    `)
                    .eq('in_stock', true)
                    .eq('is_featured', true)
                    .limit(8);

                if (error) throw error;

                if (productsData) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mappedProducts: Product[] = productsData.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        originalPrice: p.original_price,
                        image: p.image_url || (p.images && p.images[0]) || '/products/placeholder.png',
                        category: p.categories?.name || 'Uncategorized',
                        isNew: p.is_new,
                        isSale: p.is_sale,
                        createdAt: new Date(p.created_at),
                        slug: p.slug,
                        description: p.description,
                        category_id: p.category_id,
                        in_stock: p.in_stock,
                        is_featured: p.is_featured
                    }));
                    setProducts(mappedProducts);
                }
            } catch (error) {
                console.error('Error fetching featured products:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchFeaturedProducts();
    }, []);

    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12">
                    <div>
                        <span className="text-rose-600 text-sm font-medium tracking-widest uppercase">Trending Now</span>
                        <h2 className="mt-3 text-4xl font-bold text-gray-900">Featured Products</h2>
                        <p className="mt-4 text-gray-600 max-w-lg">
                            Handpicked selections that define contemporary style
                        </p>
                    </div>
                    <Link
                        href="/products"
                        className="mt-6 sm:mt-0 inline-flex items-center text-sm font-medium text-gray-900 hover:text-rose-600 transition-colors group"
                    >
                        View All Products
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))
                    ) : products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                slug={product.slug}
                                name={product.name}
                                price={product.price}
                                originalPrice={product.originalPrice}
                                image={product.image}
                                category={product.category}
                                isNew={product.isNew}
                                isSale={product.isSale}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No featured products found.
                        </div>
                    )}
                </div>

                {/* Load More */}
                <div className="mt-14 text-center">
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-900 text-gray-900 font-medium rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300"
                    >
                        Load More Products
                    </Link>
                </div>
            </div>
        </section>
    );
}
