'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

// Mock product data - will be replaced with Supabase fetch
const mockProduct = {
    id: '1',
    name: 'Signature Wool Blend Overcoat',
    slug: 'signature-wool-blend-overcoat',
    price: 12990,
    originalPrice: 16990,
    description: 'A timeless overcoat crafted from premium wool blend fabric. Features a classic silhouette with modern detailing. Perfect for layering during the cold months while maintaining a sophisticated look.',
    shortDescription: 'Premium wool blend overcoat with classic silhouette',
    category: 'Outerwear',
    categorySlug: 'women-outerwear',
    images: [
        '/products/overcoat.png',
        '/products/overcoat.png',
        '/products/overcoat.png',
        '/products/overcoat.png',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
        { name: 'Black', hex: '#1a1a1a' },
        { name: 'Camel', hex: '#c19a6b' },
        { name: 'Navy', hex: '#1e3a5f' },
    ],
    inStock: true,
    isNew: true,
    isSale: true,
    features: [
        'Premium wool blend fabric',
        'Classic double-breasted design',
        'Satin lining',
        'Two front pockets',
        'Dry clean only',
    ],
    sku: 'WOC-001',
};

const relatedProducts = [
    { id: '2', name: 'Cashmere Blend Sweater', price: 8990, image: '/products/cashmere-sweater.png', category: 'Knitwear' },
    { id: '3', name: 'Silk Blouse', price: 7490, originalPrice: 8990, image: '/products/silk-blouse.png', category: 'Tops', isSale: true },
    { id: '4', name: 'High-Waisted Wide Leg Pants', price: 5990, image: '/products/denim-jeans.png', category: 'Pants' },
    { id: '5', name: 'Linen Summer Dress', price: 6990, image: '/products/linen-dress.png', category: 'Dresses', isNew: true },
];

export default function ProductPage() {
    const params = useParams();
    const { addItem } = useCart();
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState(mockProduct.colors[0]);
    const [quantity, setQuantity] = useState(1);
    const [showAddedToast, setShowAddedToast] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'features' | 'shipping'>('description');

    const discount = mockProduct.originalPrice
        ? Math.round(((mockProduct.originalPrice - mockProduct.price) / mockProduct.originalPrice) * 100)
        : 0;

    const isWishlisted = isInWishlist(mockProduct.id);

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }

        addItem({
            productId: mockProduct.id,
            name: mockProduct.name,
            price: mockProduct.price,
            image: mockProduct.images[0],
            size: selectedSize,
            color: selectedColor.name,
            quantity,
        });

        setShowAddedToast(true);
        setTimeout(() => setShowAddedToast(false), 3000);
    };

    const handleWishlistToggle = () => {
        if (isWishlisted) {
            removeFromWishlist(mockProduct.id);
        } else {
            addToWishlist({
                id: mockProduct.id,
                name: mockProduct.name,
                price: mockProduct.price,
                image: mockProduct.images[0],
                category: mockProduct.category,
            });
        }
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Breadcrumb */}
            <div className="pt-32 pb-4 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center text-sm text-gray-500">
                        <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
                        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <Link href="/products" className="hover:text-gray-900 transition-colors">Products</Link>
                        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-900">{mockProduct.name}</span>
                    </nav>
                </div>
            </div>

            {/* Product Details */}
            <section className="py-8 lg:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
                                <Image
                                    src={mockProduct.images[selectedImage]}
                                    alt={mockProduct.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                    {mockProduct.isNew && (
                                        <span className="px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">NEW</span>
                                    )}
                                    {mockProduct.isSale && discount > 0 && (
                                        <span className="px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-full">-{discount}%</span>
                                    )}
                                </div>

                                {/* Wishlist Button */}
                                <button
                                    onClick={handleWishlistToggle}
                                    className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${isWishlisted ? 'bg-rose-100 text-rose-600' : 'bg-white text-gray-600 hover:text-rose-600'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Thumbnail Images */}
                            <div className="grid grid-cols-4 gap-4">
                                {mockProduct.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all ${selectedImage === index ? 'ring-2 ring-slate-900' : 'hover:opacity-80'
                                            }`}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={img}
                                                alt={`${mockProduct.name} view ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="lg:py-4">
                            <div className="sticky top-32">
                                {/* Category */}
                                <Link href={`/category/${mockProduct.categorySlug}`} className="text-sm text-rose-600 font-medium tracking-wider uppercase hover:text-rose-700 transition-colors">
                                    {mockProduct.category}
                                </Link>

                                {/* Title */}
                                <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-gray-900">{mockProduct.name}</h1>

                                {/* Price */}
                                <div className="mt-4 flex items-baseline gap-3">
                                    <span className="text-2xl font-bold text-gray-900">PKR {mockProduct.price.toLocaleString()}</span>
                                    {mockProduct.originalPrice && (
                                        <>
                                            <span className="text-lg text-gray-400 line-through">PKR {mockProduct.originalPrice.toLocaleString()}</span>
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-sm font-medium rounded">Save {discount}%</span>
                                        </>
                                    )}
                                </div>

                                {/* Short Description */}
                                <p className="mt-4 text-gray-600 leading-relaxed">{mockProduct.shortDescription}</p>

                                {/* Color Selection */}
                                <div className="mt-8">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900">Color: {selectedColor.name}</span>
                                    </div>
                                    <div className="mt-3 flex gap-3">
                                        {mockProduct.colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-10 h-10 rounded-full transition-all ${selectedColor.name === color.name ? 'ring-2 ring-offset-2 ring-slate-900' : ''
                                                    }`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Size Selection */}
                                <div className="mt-8">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900">Size</span>
                                        <button className="text-sm text-gray-500 underline hover:text-gray-900 transition-colors">Size Guide</button>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {mockProduct.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${selectedSize === size
                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div className="mt-8">
                                    <span className="text-sm font-medium text-gray-900">Quantity</span>
                                    <div className="mt-3 flex items-center w-fit border border-gray-200 rounded-lg">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                            </svg>
                                        </button>
                                        <span className="px-4 py-2 text-gray-900 font-medium">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Add to Cart Button */}
                                <div className="mt-8 flex gap-4">
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                                    >
                                        Add to Cart — PKR {(mockProduct.price * quantity).toLocaleString()}
                                    </button>
                                </div>

                                {/* Features Icons */}
                                <div className="mt-8 grid grid-cols-3 gap-4 py-6 border-t border-gray-100">
                                    <div className="text-center">
                                        <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                        <p className="mt-2 text-xs text-gray-500">Free Shipping</p>
                                    </div>
                                    <div className="text-center">
                                        <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <p className="mt-2 text-xs text-gray-500">Easy Returns</p>
                                    </div>
                                    <div className="text-center">
                                        <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <p className="mt-2 text-xs text-gray-500">Secure Payment</p>
                                    </div>
                                </div>

                                {/* SKU */}
                                <p className="text-xs text-gray-400">SKU: {mockProduct.sku}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Details Tabs */}
            <section className="py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Tabs */}
                    <div className="flex gap-8 border-b border-gray-200">
                        {(['description', 'features', 'shipping'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                    ? 'text-gray-900 border-b-2 border-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="mt-8">
                        {activeTab === 'description' && (
                            <div className="prose prose-gray max-w-none">
                                <p className="text-gray-600 leading-relaxed">{mockProduct.description}</p>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <ul className="space-y-3">
                                {mockProduct.features.map((feature, index) => (
                                    <li key={index} className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-3 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {activeTab === 'shipping' && (
                            <div className="space-y-4 text-gray-600">
                                <p><strong>Delivery:</strong> 3-5 business days within Pakistan</p>
                                <p><strong>Free Shipping:</strong> On orders above PKR 5,000</p>
                                <p><strong>Returns:</strong> Easy 30-day return policy</p>
                                <p><strong>International:</strong> Contact us for international shipping rates</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Related Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
                        {relatedProducts.map((product) => (
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
                </div>
            </section>

            {/* Added to Cart Toast */}
            <div
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showAddedToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
            >
                <div className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-full shadow-xl">
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Added to cart!
                    <Link href="/cart" className="ml-2 text-rose-400 hover:text-rose-300 transition-colors">
                        View Cart
                    </Link>
                </div>
            </div>

            <Footer />
        </main>
    );
}
