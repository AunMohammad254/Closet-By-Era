'use client';

import { useState, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import CustomDropdown from '@/components/CustomDropdown';
import { Product } from '@/lib/supabase';

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
    categories: string[];
}

const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling'];

export default function ProductGrid({ initialProducts, categories }: ProductGridProps) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState('Newest');

    // We use the passed initialProducts directly. 
    // In a real generic grid, we might fetch more, but for now we trust the server sent valid data.
    const products = initialProducts;

    // Filter and sort products based on selected options
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = [...products];

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        // Sort based on sort option
        switch (sortOption) {
            case 'Price: Low to High':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'Price: High to Low':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'Newest':
                filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                break;
            case 'Best Selling':
                // Prioritize sale and new items (proxy for best selling usually)
                filtered.sort((a, b) => {
                    const aScore = (a.isSale ? 2 : 0) + (a.isNew ? 1 : 0);
                    const bScore = (b.isSale ? 2 : 0) + (b.isNew ? 1 : 0);
                    return bScore - aScore;
                });
                break;
            default:
                break;
        }

        return filtered;
    }, [selectedCategory, sortOption, products]);

    return (
        <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${selectedCategory === cat
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{filteredAndSortedProducts.length} products</span>
                        <CustomDropdown
                            options={sortOptions.map(option => ({ value: option, label: option }))}
                            value={sortOption}
                            onChange={(value) => setSortOption(value)}
                            variant="slate"
                        />
                    </div>
                </div>

                {/* Products Grid */}
                {filteredAndSortedProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-gray-400 mb-4 text-6xl">🛍️</div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500">Try adjusting your filters or check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                        {filteredAndSortedProducts.map((product) => (
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
                    </div>
                )}
            </div>
        </section>
    );
}
