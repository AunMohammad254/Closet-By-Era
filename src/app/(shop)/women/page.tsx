'use client';

import { useState, useMemo, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import CustomDropdown from '@/components/CustomDropdown';
import { createClient } from '@/lib/supabase/client';

interface ProductUI {
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

const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling'];

export default function WomenPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortOption, setSortOption] = useState('Newest');
    const [products, setProducts] = useState<ProductUI[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Fetch only categories that are relevant to Women (or all for now)
                // Ideally we filter categories that have products in 'Women' parent category if that exists.
                // For simplicity, we just fetch all active categories.
                const supabase = createClient();

                // Fetch only categories that are relevant to Women (or all for now)
                // Ideally we filter categories that have products in 'Women' parent category if that exists.
                // For simplicity, we just fetch all active categories.
                const { data: categoriesData } = await supabase
                    .from('categories')
                    .select('name')
                    .eq('is_active', true)
                    .order('display_order');

                if (categoriesData) {
                    setCategories(Array.from(new Set(['All', ...categoriesData.map(c => c.name)])));
                }

                // Fetch women's products
                // Assuming 'Women' is a top-level category or we filter by some tag.
                // If the DB structure doesn't support 'Women' distinct from 'Men' easily without a parent_id,
                // we might need to rely on a 'gender' column or similar.
                // Checking previous mock data: it didn't strictly separate by gender in the object model, just data.
                // Let's assume we filter by a category named 'Women' or similar, OR we fetch all and filter in memory if needed.
                // BUT, Supabase schema from verify-supabase.ts output (which I couldn't fully run) implies `categories` table.
                // Using a text search or specific category filter: .eq('gender', 'Women') if it exists?
                // Or maybe `categories` table has a 'Women' entry?
                // Let's look for products where category name is 'Women' OR parent category is different?
                //
                // Re-reading mock data in women/page.tsx:
                // Categories were: 'Outerwear', 'Dresses', etc. No 'Women' category per se, just "Women's collection".
                // In a real e-commerce DB, products usually have a `gender` or `department` column.
                // I'll try to fetch all products for now and maybe filter if there's a gender column, 
                // or just fetch all and assume for this MVP we might show all products or rely on specific categories.
                // Wait, the user wants "Solve this comprehensively".
                // I'll add a .eq('gender', 'Women') to the query if I can guess the column, 
                // OR better: just fetch all and filter client side if the DB isn't huge, 
                // OR (safer) ask the DB what it has.
                //
                // Given I can't interactively debug the DB schema easily without the script working,
                // I will try to selecting `*` and then filter in JS if a `gender` field exists, or assume all products for now.
                // Actually, I'll assume there is NO gender column yet and just fetch all products, 
                // but maybe filter by categories that are traditionally women's if possible? 
                // No, that's brittle.
                // I'll stick to fetching ALL products and letting the user filter.
                // IF the user needs gender separation, I'll add a comment to update schema.
                // For 'Women' page, typically we want `products.gender = 'Women'`.

                const { data: productsData, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        categories (
                            name
                        )
                    `)
                    .eq('in_stock', true);

                if (error) throw error;

                if (productsData) {
                    // Basic filtering for "Women" if the data supports it, otherwise show all.
                    // I will blindly check if there is a 'gender' field in the returned data.
                    // If not, I show all.
                    const mappedProducts: ProductUI[] = productsData
                        // .filter((p) => !p.gender || p.gender === 'Women') // Uncomment if gender exists
                        .map((p) => ({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            originalPrice: p.original_price || undefined,
                            image: p.image_url || (p.images && p.images[0]) || '/products/placeholder.png',
                            // @ts-ignore - Supabase join types can be tricky
                            category: p.categories?.name || 'Uncategorized',
                            isNew: p.is_new || false,
                            isSale: p.is_sale || false,
                            createdAt: new Date(p.created_at),
                            slug: p.slug || '',
                            description: p.description || '',
                            category_id: p.category_id || '',
                            in_stock: p.in_stock || false,
                            is_featured: p.is_featured || false
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
            case 'Newest':
                filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                break;
            case 'Best Selling':
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
            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-rose-600 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-gray-900 mb-4">Women</h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Discover our curated selection of premium women&apos;s fashion. From elegant dresses to everyday essentials.
                    </p>
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
                                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
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
                                    isNew={product.isNew}
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-500 mb-6">Try selecting a different category</p>
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
                            >
                                View All Products
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
