'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

// Mock data for women's products
const womenProducts = [
    { id: '1', name: 'Signature Wool Blend Overcoat', price: 12990, originalPrice: 16990, image: '/products/w1.jpg', category: 'Outerwear', isNew: true },
    { id: '2', name: 'Cashmere Blend Sweater', price: 8990, image: '/products/w2.jpg', category: 'Knitwear' },
    { id: '3', name: 'Linen Summer Dress', price: 6990, image: '/products/w3.jpg', category: 'Dresses', isNew: true },
    { id: '4', name: 'Silk Blouse', price: 7490, originalPrice: 8990, image: '/products/w4.jpg', category: 'Tops', isSale: true },
    { id: '5', name: 'High-Waisted Wide Leg Pants', price: 5990, image: '/products/w5.jpg', category: 'Pants' },
    { id: '6', name: 'Leather Crossbody Bag', price: 7990, originalPrice: 9990, image: '/products/w6.jpg', category: 'Accessories', isSale: true },
    { id: '7', name: 'Midi Pleated Skirt', price: 4990, image: '/products/w7.jpg', category: 'Skirts', isNew: true },
    { id: '8', name: 'Cotton Cardigan', price: 5490, image: '/products/w8.jpg', category: 'Knitwear' },
];

const categories = ['All', 'Outerwear', 'Dresses', 'Tops', 'Pants', 'Knitwear', 'Skirts', 'Accessories'];

type SortOption = 'newest' | 'price-low-high' | 'price-high-low';

export default function WomenPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        // First, filter by category
        let filtered = selectedCategory === 'All'
            ? womenProducts
            : womenProducts.filter(product => product.category === selectedCategory);

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
                                    onClick={() => handleCategoryClick(cat)}
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
                            <select 
                                value={sortBy}
                                onChange={handleSortChange}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer appearance-none pr-10"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.5rem center',
                                    backgroundSize: '1.5rem 1.5rem'
                                }}
                            >
                                <option value="newest">Newest</option>
                                <option value="price-low-high">Price: Low to High</option>
                                <option value="price-high-low">Price: High to Low</option>
                            </select>
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
                                className="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
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
