'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface ProductFiltersProps {
    categories: string[];
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local state for immediate UI feedback (debounced update for price)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 50000 });
    const [sort, setSort] = useState('newest');

    // Sync from URL
    useEffect(() => {
        const catParam = searchParams.get('categories');
        if (catParam) {
            setSelectedCategories(catParam.split(','));
        } else {
            setSelectedCategories([]);
        }

        const min = searchParams.get('minPrice');
        const max = searchParams.get('maxPrice');
        if (min || max) {
            setPriceRange({
                min: min ? parseInt(min) : 0,
                max: max ? parseInt(max) : 50000
            });
        }

        const sortParam = searchParams.get('sort');
        if (sortParam) {
            setSort(sortParam);
        }
    }, [searchParams]);

    // Update URL Helper
    const updateUrl = useCallback((newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        // Always reset to page 1 on filter change
        params.delete('page');

        router.push(`/products?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    const handleCategoryChange = (category: string) => {
        const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];

        setSelectedCategories(newCategories);

        updateUrl({
            categories: newCategories.length > 0 ? newCategories.join(',') : null
        });
    };

    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        const numValue = parseInt(value) || 0;
        const newRange = { ...priceRange, [type]: numValue };
        setPriceRange(newRange);

        // Debounce URL update could be added here, but for now apply on blur or "Apply" button
    };

    const applyPriceFilter = () => {
        updateUrl({
            minPrice: priceRange.min > 0 ? priceRange.min.toString() : null,
            maxPrice: priceRange.max < 50000 ? priceRange.max.toString() : null
        });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSort = e.target.value;
        setSort(newSort);
        updateUrl({ sort: newSort });
    };

    const clearAll = () => {
        setSelectedCategories([]);
        setPriceRange({ min: 0, max: 50000 });
        setSort('newest');
        router.push('/products');
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                    onClick={clearAll}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                >
                    Clear All
                </button>
            </div>

            {/* Sort (Mobile/Sidebar friendly) */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sort By</h4>
                <select
                    value={sort}
                    onChange={handleSortChange}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                    <option value="newest">Newest Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
            </div>

            {/* Categories */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {categories.map((cat) => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(cat)}
                                    onChange={() => handleCategoryChange(cat)}
                                    className="peer h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />
                            </div>
                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                {cat}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range (PKR)</h4>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-xs text-gray-400">Min</span>
                            <input
                                type="number"
                                value={priceRange.min}
                                onChange={(e) => handlePriceChange('min', e.target.value)}
                                className="w-full pl-3 pr-3 py-2 pt-6 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-xs text-gray-400">Max</span>
                            <input
                                type="number"
                                value={priceRange.max}
                                onChange={(e) => handlePriceChange('max', e.target.value)}
                                className="w-full pl-3 pr-3 py-2 pt-6 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={applyPriceFilter}
                        className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Apply Price
                    </button>
                </div>
            </div>
        </div>
    );
}
