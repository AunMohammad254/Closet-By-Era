'use client';

import { useState, useMemo, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import CustomDropdown from '@/components/CustomDropdown';
import { fetchCategoryCatalog } from '@/lib/catalog';

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
                // Only this department (root category + sub-categories).
                const { categoryNames, products: productsData } = await fetchCategoryCatalog('women');
                setCategories(['All', ...categoryNames]);

                if (productsData) {
                    const mappedProducts: ProductUI[] = productsData
                        .map((p) => ({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            originalPrice: p.original_price || undefined,
                            image: p.image_url || (p.images && p.images[0]) || '/products/placeholder.png',
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
        <main className="min-h-screen bg-background">
            {/* Hero */}
            <section className="pt-32 pb-16 bg-linear-to-br from-rose-50/50 via-pink-50/50 to-amber-50/50 dark:from-rose-950/20 dark:via-pink-950/20 dark:to-amber-950/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/30 dark:bg-rose-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/30 dark:bg-amber-500/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-rose-600 dark:text-rose-400 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-foreground mb-4">Women</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Discover our curated selection of premium women&apos;s fashion. From elegant dresses to everyday essentials.
                    </p>
                </div>
            </section>

            {/* Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-border">
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${selectedCategory === cat
                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-none'
                                        : 'bg-muted text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
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
                                    <div className="aspect-3/4 bg-muted rounded-xl mb-4"></div>
                                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-muted rounded w-1/2"></div>
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
                            <div className="text-muted-foreground mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
                            <p className="text-muted-foreground mb-6">Try selecting a different category</p>
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
