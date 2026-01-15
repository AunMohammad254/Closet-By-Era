import { Suspense } from 'react';
import Link from 'next/link';
import { getFeaturedProducts } from '@/actions/homepage';
import FeaturedProductsGrid from './FeaturedProductsGrid';
import FeaturedProductsSkeleton from './FeaturedProductsSkeleton';

/**
 * Server Component that fetches featured products at build/request time
 * This is much faster than client-side fetching as:
 * 1. No JavaScript bundle required for data fetching
 * 2. Data is fetched on the server (closer to DB)
 * 3. HTML is streamed with data already included
 */
async function FeaturedProductsContent() {
    const products = await getFeaturedProducts(8);
    return <FeaturedProductsGrid products={products} />;
}

export default function FeaturedProducts() {
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

                {/* Products Grid with Suspense */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                    <Suspense fallback={<FeaturedProductsSkeleton />}>
                        <FeaturedProductsContent />
                    </Suspense>
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
