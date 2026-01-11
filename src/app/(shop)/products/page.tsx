'use client';

import { useState, useMemo, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import CustomDropdown from '@/components/CustomDropdown';
import { supabase, Product as ProductDB, Category } from '@/lib/supabase';

interface Product extends Omit<ProductDB, 'created_at'> {
    originalPrice?: number;
    category: string;
    createdAt: Date;
    image: string; // Map image_url or first image to this
    isNew?: boolean;
    isSale?: boolean;
}

const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling'];

export default function ProductsPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState('Newest');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);

    // Fetch products and categories
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Fetch categories
                const { data: categoriesData } = await supabase
                    .from('categories')
                    .select('name, slug')
                    .eq('is_active', true)
                    .order('display_order');

                if (categoriesData) {
                    setCategories(['All', ...categoriesData.map(c => c.name)]);
                }

                // Fetch products with category info
                // Note: Assuming we can fetch category name via join or separate map
                // For now, simpler to just fetch all and map if we had a join.
                // If no foreign key setup for auto-join, we might need to fetch manually.

                const { data: productsData, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        categories (
                            name
                        )
                    `)
                    .eq('in_stock', true); // Only show in-stock items?

                if (error) throw error;

                if (productsData) {
                    const mappedProducts: Product[] = productsData.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        originalPrice: p.original_price,
                        // Use first image from images array or image_url
                        image: p.image_url || (p.images && p.images[0]) || '/products/placeholder.png',
                        category: p.categories?.name || 'Uncategorized', // Access joined category name
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
                // Fallback or empty state could be handled here
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

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
        <main className="min-h-screen bg-white">

            {/* Hero Banner */}
            <section className="pt-32 pb-12 bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">All Products</h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Explore our complete collection of premium fashion essentials
                    </p>
                </div>
            </section>

            {/* Filters & Products */}
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
                    ) : filteredAndSortedProducts.length === 0 ? (
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

                    {/* Pagination - Optional or Hidden if not implemented yet */}
                    {!loading && filteredAndSortedProducts.length > 0 && (
                        <div className="mt-14 flex justify-center">
                            {/* Pagination Logic Placeholder */}
                        </div>
                    )}
                </div>
            </section>

        </main>
    );
}
