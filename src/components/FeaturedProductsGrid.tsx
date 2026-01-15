'use client';

import { memo } from 'react';
import ProductCard from './ProductCard';
import type { FeaturedProductData } from '@/actions/homepage';

interface FeaturedProductsGridProps {
    products: FeaturedProductData[];
}

/**
 * Client component for rendering the product grid with interactivity
 * Receives pre-fetched data from server component
 */
function FeaturedProductsGrid({ products }: FeaturedProductsGridProps) {
    if (products.length === 0) {
        return (
            <div className="col-span-full text-center py-10 text-gray-500">
                No featured products found.
            </div>
        );
    }

    return (
        <>
            {products.map((product) => (
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
            ))}
        </>
    );
}

// Memoize to prevent re-renders when products haven't changed
export default memo(FeaturedProductsGrid);
