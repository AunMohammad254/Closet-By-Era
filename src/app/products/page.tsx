'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CustomDropdown from '@/components/CustomDropdown';

// Mock products - will be replaced with Supabase data
const allProducts = [
    { id: '1', name: 'Signature Wool Blend Overcoat', price: 12990, originalPrice: 16990, image: '/products/1.jpg', category: 'Outerwear', isNew: true, createdAt: new Date('2024-01-15') },
    { id: '2', name: 'Premium Cotton Oxford Shirt', price: 4490, image: '/products/2.jpg', category: 'Shirts', isNew: true, createdAt: new Date('2024-01-14') },
    { id: '3', name: 'Slim Fit Stretch Chinos', price: 5990, originalPrice: 7490, image: '/products/3.jpg', category: 'Pants', isSale: true, createdAt: new Date('2024-01-10') },
    { id: '4', name: 'Cashmere Blend Sweater', price: 8990, image: '/products/4.jpg', category: 'Knitwear', createdAt: new Date('2024-01-08') },
    { id: '5', name: 'Classic Leather Belt', price: 2990, originalPrice: 3990, image: '/products/5.jpg', category: 'Accessories', isSale: true, createdAt: new Date('2024-01-05') },
    { id: '6', name: 'Tailored Blazer', price: 14990, image: '/products/6.jpg', category: 'Outerwear', isNew: true, createdAt: new Date('2024-01-16') },
    { id: '7', name: 'Relaxed Fit Denim Jeans', price: 6490, image: '/products/7.jpg', category: 'Denim', createdAt: new Date('2024-01-03') },
    { id: '8', name: 'Merino Wool Scarf', price: 3490, originalPrice: 4490, image: '/products/8.jpg', category: 'Accessories', isSale: true, createdAt: new Date('2024-01-02') },
    { id: '9', name: 'Cotton Polo Shirt', price: 3990, image: '/products/9.jpg', category: 'Shirts', createdAt: new Date('2024-01-01') },
    { id: '10', name: 'Leather Crossbody Bag', price: 7990, originalPrice: 9990, image: '/products/10.jpg', category: 'Accessories', isSale: true, createdAt: new Date('2023-12-28') },
    { id: '11', name: 'Linen Summer Dress', price: 6990, image: '/products/11.jpg', category: 'Dresses', isNew: true, createdAt: new Date('2024-01-12') },
    { id: '12', name: 'Classic Watch Silver', price: 12990, image: '/products/12.jpg', category: 'Accessories', createdAt: new Date('2023-12-20') },
];

const categories = ['All', 'Outerwear', 'Shirts', 'Pants', 'Knitwear', 'Dresses', 'Denim', 'Accessories'];
const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling'];

export default function ProductsPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState('Newest');

    // Filter and sort products based on selected options
    const filteredAndSortedProducts = useMemo(() => {
        // First, filter by category
        let filtered = selectedCategory === 'All'
            ? [...allProducts]
            : allProducts.filter(product => product.category === selectedCategory);

        // Then, sort based on sort option
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
                // For now, prioritize items on sale, then new items
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
    }, [selectedCategory, sortOption]);

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

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

                    {/* Pagination */}
                    <div className="mt-14 flex justify-center">
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 text-white font-medium">1</button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">2</button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">3</button>
                            <span className="px-2 text-gray-400">...</span>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">8</button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:border-gray-300 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
