'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CustomDropdown from '@/components/CustomDropdown';

// Mock data for men's products
const menProducts = [
    { id: '1', name: 'Premium Cotton Oxford Shirt', price: 4490, image: '/products/m1.jpg', category: 'Shirts', isNew: true },
    { id: '2', name: 'Slim Fit Stretch Chinos', price: 5990, originalPrice: 7490, image: '/products/m2.jpg', category: 'Pants', isSale: true },
    { id: '3', name: 'Tailored Blazer', price: 14990, image: '/products/m3.jpg', category: 'Outerwear', isNew: true },
    { id: '4', name: 'Relaxed Fit Denim Jeans', price: 6490, image: '/products/m4.jpg', category: 'Denim' },
    { id: '5', name: 'Cotton Polo Shirt', price: 3990, image: '/products/m5.jpg', category: 'Shirts' },
    { id: '6', name: 'Classic Leather Belt', price: 2990, originalPrice: 3990, image: '/products/m6.jpg', category: 'Accessories', isSale: true },
    { id: '7', name: 'Wool Blend Pullover', price: 7990, image: '/products/m7.jpg', category: 'Knitwear' },
    { id: '8', name: 'Casual Linen Shirt', price: 4990, image: '/products/m8.jpg', category: 'Shirts', isNew: true },
];

const categories = ['All', 'Shirts', 'Pants', 'Denim', 'Outerwear', 'Knitwear', 'Accessories'];

type SortOption = 'newest' | 'price-low-high' | 'price-high-low';

export default function MenPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        // First, filter by category
        let filtered = selectedCategory === 'All'
            ? menProducts
            : menProducts.filter(product => product.category === selectedCategory);

        // Then, sort by selected option
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low-high':
                    return a.price - b.price;
                case 'price-high-low':
                    return b.price - a.price;
                case 'newest':
                default:
                    // For newest, prioritize items marked as new, then by id (descending)
                    if (a.isNew && !b.isNew) return -1;
                    if (!a.isNew && b.isNew) return 1;
                    return parseInt(b.id) - parseInt(a.id);
            }
        });

        return sorted;
    }, [selectedCategory, sortBy]);

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value as SortOption);
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-slate-300/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gray-300/30 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-slate-600 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-gray-900 mb-4">Men</h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Explore our refined collection of men&apos;s fashion. Timeless pieces crafted for the modern gentleman.
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
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${selectedCategory === cat
                                        ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                        : 'bg-gray-100 text-gray-700 hover:bg-slate-100 hover:text-slate-900'
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
                                options={[
                                    { value: 'newest', label: 'Newest' },
                                    { value: 'price-low-high', label: 'Price: Low to High' },
                                    { value: 'price-high-low', label: 'Price: High to Low' }
                                ]}
                                value={sortBy}
                                onChange={(value) => setSortBy(value as SortOption)}
                                variant="slate"
                            />
                        </div>
                    </div>

                    {/* Products Grid */}
                    {filteredAndSortedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                            {filteredAndSortedProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
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
                                className="px-6 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors"
                            >
                                View All Products
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
