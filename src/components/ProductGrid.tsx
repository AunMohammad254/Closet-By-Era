'use client';

import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/database';

// Extended product interface for UI logic
export interface ProductUI extends Product {
    originalPrice?: number;
    category: string;
    createdAt: Date;
    image: string;
    isNew?: boolean;
    isSale?: boolean;
}

interface ProductGridProps {
    initialProducts: ProductUI[];
}

const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling'];

export default function ProductGrid({ initialProducts }: ProductGridProps) {
    // We rely on server-side filtering now, so initialProducts is already filtered
    const products = initialProducts;

    return (
        <section className="py-8">
            {/* Products Grid */}
            {products.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-2xl">
                    <div className="text-gray-400 mb-4 text-6xl">🛍️</div>
                    <h3 className="text-xl font-medium text-foreground mb-2">No products found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground mb-6">{products.length} products found</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                slug={product.slug || ''}
                                name={product.name}
                                price={product.price}
                                originalPrice={product.originalPrice}
                                image={product.image || product.image_url || ''}
                                category={product.category}
                                isNew={product.isNew}
                                isSale={product.isSale}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
