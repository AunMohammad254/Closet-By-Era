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

const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Featured'];

export default function NewArrivalsPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortOption, setSortOption] = useState('Newest');
    const [products, setProducts] = useState<ProductUI[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const supabase = createClient();

                // Fetch Categories
                const { data: categoriesData } = await supabase
                    .from('categories')
                    .select('name')
                    .eq('is_active', true)
                    .order('display_order');

                if (categoriesData) {
                    setCategories(['All', ...Array.from(new Set(categoriesData.map(c => c.name)))]);
                }

                // Fetch Products where is_new is true
                const { data: productsData, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        categories (
                            name
                        )
                    `)
                    .eq('is_active', true)
                    .eq('in_stock', true)
                    .eq('is_new', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (productsData) {
                    const mappedProducts: ProductUI[] = productsData.map((p) => ({
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
                console.error('Error fetching new arrivals:', error);
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

        filtered.sort((a, b) => {
            switch (sortOption) {
                case 'Price: Low to High':
                    return a.price - b.price;
                case 'Price: High to Low':
                    return b.price - a.price;
                case 'Featured':
                    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
                case 'Newest':
                default:
                    return b.createdAt.getTime() - a.createdAt.getTime();
            }
        });

        return filtered;
    }, [products, selectedCategory, sortOption]);

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Banner */}
            <div className="relative bg-linear-to-r from-slate-900 via-rose-950 to-slate-900 text-white py-16 sm:py-20 overflow-hidden">
                <div className="absolute inset-0 bg-radial-[ellipse_at_top] from-rose-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-4">
                        Fresh Releases
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                        New Arrivals
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                        Explore our latest contemporary designs, seasonal fabrics, and limited releases.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Filters and Sorting */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-border">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                        {categories.map((category) => (
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
                            Showing <strong className="text-foreground">{filteredAndSortedProducts.length}</strong> items
                        </span>
                        <div className="w-48">
                            <CustomDropdown
                                options={sortOptions.map(opt => ({ value: opt, label: opt }))}
                                value={sortOption}
                                onChange={setSortOption}
                                variant="rose"
                            />
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-3/4 bg-muted rounded-2xl mb-4" />
                                <div className="h-4 bg-muted rounded-md w-3/4 mb-2" />
                                <div className="h-4 bg-muted rounded-md w-1/4" />
                            </div>
                        ))}
                    </div>
                ) : filteredAndSortedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {filteredAndSortedProducts.map((product) => (
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
                            onClick={() => setSelectedCategory('All')}
                            className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors"
                        >
                            Reset Filter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
