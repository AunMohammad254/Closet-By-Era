'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

// Mock data for sale products
const saleProducts = [
    { id: '1', name: 'Signature Wool Blend Overcoat', price: 12990, originalPrice: 16990, image: '/products/s1.jpg', category: 'Outerwear', isSale: true },
    { id: '2', name: 'Slim Fit Stretch Chinos', price: 5990, originalPrice: 7490, image: '/products/s2.jpg', category: 'Pants', isSale: true },
    { id: '3', name: 'Classic Leather Belt', price: 2990, originalPrice: 3990, image: '/products/s3.jpg', category: 'Accessories', isSale: true },
    { id: '4', name: 'Merino Wool Scarf', price: 3490, originalPrice: 4490, image: '/products/s4.jpg', category: 'Accessories', isSale: true },
    { id: '5', name: 'Leather Crossbody Bag', price: 7990, originalPrice: 9990, image: '/products/s5.jpg', category: 'Accessories', isSale: true },
    { id: '6', name: 'Silk Blouse', price: 7490, originalPrice: 8990, image: '/products/s6.jpg', category: 'Tops', isSale: true },
    { id: '7', name: 'Cashmere Sweater', price: 9990, originalPrice: 14990, image: '/products/s7.jpg', category: 'Knitwear', isSale: true },
    { id: '8', name: 'Premium Leather Loafers', price: 8990, originalPrice: 12990, image: '/products/s8.jpg', category: 'Footwear', isSale: true },
];

const categories = ['All', 'Outerwear', 'Tops', 'Pants', 'Knitwear', 'Footwear', 'Accessories'];

type SortOption = 'biggest-discount' | 'price-low-high' | 'price-high-low';

// Calculate discount percentage
const getDiscountPercent = (price: number, originalPrice?: number): number => {
    if (!originalPrice) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export default function SalePage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortBy, setSortBy] = useState<SortOption>('biggest-discount');

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        // First, filter by category
        let filtered = selectedCategory === 'All'
            ? saleProducts
            : saleProducts.filter(product => product.category === selectedCategory);

        // Then, sort by selected option
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low-high':
                    return a.price - b.price;
                case 'price-high-low':
                    return b.price - a.price;
                case 'biggest-discount':
                default:
                    // Sort by discount percentage (highest first)
                    const discountA = getDiscountPercent(a.price, a.originalPrice);
                    const discountB = getDiscountPercent(b.price, b.originalPrice);
                    return discountB - discountA;
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
                            <span className="text-3xl font-bold text-white">{saleProducts.length}</span>
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
                                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'item' : 'items'} on sale
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
                                <option value="biggest-discount">Biggest Discount</option>
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

            <Footer />
        </main>
    );
}
