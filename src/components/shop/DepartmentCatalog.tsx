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

const THEMES = {
    slate: {
        active: 'bg-slate-900 text-white shadow-md shadow-slate-300 dark:bg-slate-50 dark:text-slate-900 dark:shadow-none',
        inactive: 'bg-muted text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        reset: 'bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200',
    },
    rose: {
        active: 'bg-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-none',
        inactive: 'bg-muted text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400',
        reset: 'bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors',
    },
    amber: {
        active: 'bg-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-none',
        inactive: 'bg-muted text-muted-foreground hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-400',
        reset: 'bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors',
    },
} as const;

interface DepartmentCatalogProps {
    products: CatalogProduct[];
    /** Filter buttons after "All". */
    categories: string[];
    /** The first one is the initial order. */
    sortOptions: CatalogSort[];
    theme: keyof typeof THEMES;
    /** The count label, e.g. ["product", "products"]. */
    countNoun: [one: string, other: string];
    emptyTitle: string;
    resetLabel: string;
    /** The sale page shows discount badges only. */
    showNewBadge?: boolean;
}

/** Category filter, sort and product grid of a department or sale page. */
export default function DepartmentCatalog({
    products,
    categories,
    sortOptions,
    theme,
    countNoun,
    emptyTitle,
    resetLabel,
    showNewBadge = true,
}: DepartmentCatalogProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
    const [sortOption, setSortOption] = useState<CatalogSort>(sortOptions[0]);
    const colors = THEMES[theme];

    const visibleProducts = useMemo(
        () => filterAndSortCatalog(products, selectedCategory, sortOption),
        [products, selectedCategory, sortOption]
    );
    const count = visibleProducts.length;

    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-border">
                    <div className="flex flex-wrap gap-2">
                        {[ALL_CATEGORIES, ...categories].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${selectedCategory === cat ? colors.active : colors.inactive}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {count} {count === 1 ? countNoun[0] : countNoun[1]}
                        </span>
                        <CustomDropdown
                            options={sortOptions.map(option => ({ value: option, label: option }))}
                            value={sortOption}
                            onChange={(value) => setSortOption(value as CatalogSort)}
                            variant={theme}
                        />
                    </div>
                </div>

                {/* Products Grid */}
                {count > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                        {visibleProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                slug={product.slug}
                                name={product.name}
                                price={product.price}
                                originalPrice={product.originalPrice}
                                image={product.image}
                                category={product.category}
                                isNew={showNewBadge && product.isNew}
                                isSale={product.isSale}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-muted-foreground mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">{emptyTitle}</h3>
                        <p className="text-muted-foreground mb-6">Try selecting a different category</p>
                        <button
                            onClick={() => setSelectedCategory(ALL_CATEGORIES)}
                            className={`px-6 py-2 ${colors.reset}`}
                        >
                            {resetLabel}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
