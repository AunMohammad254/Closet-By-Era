'use client';

import { useState, useMemo, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import CustomDropdown from '@/components/CustomDropdown';
import { supabase } from '@/lib/supabase';

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

const sortOptions = ['Biggest Discount', 'Price: Low to High', 'Price: High to Low'];

// Calculate discount percentage
const getDiscountPercent = (price: number, originalPrice?: number): number => {
    if (!originalPrice) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export default function SalePage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortOption, setSortOption] = useState('Biggest Discount');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Fetch Categories
                const { data: categoriesData } = await supabase
                    .from('categories')
                    .select('name')
                    .eq('is_active', true)
                    .order('display_order');

                if (categoriesData) {
                    setCategories(['All', ...categoriesData.map(c => c.name)]);
                }

                // Fetch Products
                const { data: productsData, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        categories (
                            name
                        )
                    `)
                    .eq('in_stock', true)
                    .eq('is_sale', true); // Only fetch items on sale

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
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = [...products];

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        switch (sortOption) {
            case 'Price: Low to High':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'Price: High to Low':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'Biggest Discount':
            default:
                filtered.sort((a, b) => {
                    const discountA = getDiscountPercent(a.price, a.originalPrice);
                    const discountB = getDiscountPercent(b.price, b.originalPrice);
                    return discountB - discountA;
                });
                break;
        }

        return filtered;
    }, [selectedCategory, sortOption, products]);

    return (
        <main className="min-h-screen bg-white">
            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-rose-600 via-rose-500 to-red-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium tracking-wider mb-6">
                        LIMITED TIME
                    </span>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4">
                        Winter Sale
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl mb-8">
                        Up to 50% off on selected items. Don&apos;t miss out on our biggest sale of the season.
                    </p>
                    <div className="flex items-center gap-6 text-white/80">
                        <div>
                            <span className="text-3xl font-bold text-white">50%</span>
                            <span className="block text-sm">Max Discount</span>
                        </div>
                        <div className="w-px h-12 bg-white/30" />
                        <div>
                            <span className="text-3xl font-bold text-white">{products.length}</span>
                            <span className="block text-sm">Items on Sale</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${selectedCategory === cat
                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-600'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'item' : 'items'} on sale
                            </span>
                            <CustomDropdown
                                options={sortOptions.map(option => ({ value: option, label: option }))}
                                value={sortOption}
                                onChange={(value) => setSortOption(value)}
                                variant="rose"
                            />
                        </div>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredAndSortedProducts.length > 0 ? (
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
                                    isSale={product.isSale}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No sale items found</h3>
                            <p className="text-gray-500 mb-6">Try selecting a different category</p>
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
                            >
                                View All Sale Items
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
