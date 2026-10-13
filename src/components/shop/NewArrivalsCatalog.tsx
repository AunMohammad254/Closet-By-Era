'use client';

import { useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import CustomDropdown from '@/components/CustomDropdown';
import {
    ALL_CATEGORIES,
    filterAndSortCatalog,
    type CatalogProduct,
    type CatalogSort,
} from '@/lib/catalog-filter';

const SORT_OPTIONS: CatalogSort[] = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Featured'];

/** Category tabs, sort and product grid of the New Arrivals page. */
export default function NewArrivalsCatalog({ products, categories }: { products: CatalogProduct[]; categories: string[] }) {
    const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
    const [sortOption, setSortOption] = useState<CatalogSort>('Newest');

    const visibleProducts = useMemo(
        () => filterAndSortCatalog(products, selectedCategory, sortOption),
        [products, selectedCategory, sortOption]
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Filters and Sorting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-border">
                {/* Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                    {[ALL_CATEGORIES, ...categories].map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                selectedCategory === category
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Right side: Count & Sort */}
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing <strong className="text-foreground">{visibleProducts.length}</strong> items
                    </span>
                    <div className="w-48">
                        <CustomDropdown
                            options={SORT_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                            value={sortOption}
                            onChange={(value) => setSortOption(value as CatalogSort)}
                            variant="rose"
                        />
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            {visibleProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {visibleProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            name={product.name}
                            price={product.price}
                            originalPrice={product.originalPrice}
                            image={product.image}
                            category={product.category}
                            slug={product.slug}
                            isNew={product.isNew}
                            isSale={product.isSale}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-xl font-medium text-foreground mb-2">No products found</p>
                    <p className="text-muted-foreground mb-6">Try selecting a different category</p>
                    <button
                        onClick={() => setSelectedCategory(ALL_CATEGORIES)}
                        className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors"
                    >
                        Reset Filter
                    </button>
                </div>
            )}
        </div>
    );
}
