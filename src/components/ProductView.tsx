'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Review } from '@/actions/reviews';

// Extracted components
import ProductGallery from './product/ProductGallery';
import ProductTabs from './product/ProductTabs';
import AddToCartToast from './product/AddToCartToast';
import RelatedProducts, { RelatedProduct } from './product/RelatedProducts';
import ReviewList from './reviews/ReviewList';
import ReviewForm from './reviews/ReviewForm';
import SizeGuideModal from './product/SizeGuideModal';
import RecentlyViewed from './product/RecentlyViewed';
import ColorSelector, { ProductColor } from './product/ColorSelector';
import SizeSelector from './product/SizeSelector';
import QuantitySelector from './product/QuantitySelector';
import ProductActions from './product/ProductActions';

export type { ProductColor };

export interface ProductDetails {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    shortDescription?: string;
    category: string;
    categorySlug: string;
    images: string[];
    sizes: string[];
    colors: ProductColor[];
    inStock: boolean;
    isNew?: boolean;
    isSale?: boolean;
    features: string[];
    sku: string;
}

interface ProductViewProps {
    product: ProductDetails;
    relatedProducts: RelatedProduct[];
    reviews?: Review[];
}

export default function ProductView({ product, relatedProducts, reviews = [] }: ProductViewProps) {
    const { addItem } = useCart();
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
    const { formatPrice } = useCurrency();

    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0] || { name: 'Default', hex: '#000000' });
    const [quantity, setQuantity] = useState(1);
    const [showAddedToast, setShowAddedToast] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const isWishlisted = isInWishlist(product.id);

    // Track Recently Viewed
    useEffect(() => {
        try {
            const stored = localStorage.getItem('recently_viewed');
            let ids: string[] = stored ? JSON.parse(stored) : [];
            ids = ids.filter(id => id !== product.id);
            ids.unshift(product.id);
            ids = ids.slice(0, 10);
            localStorage.setItem('recently_viewed', JSON.stringify(ids));
        } catch (e) {
            console.error('Error saving recent view', e);
        }
    }, [product.id]);

    const handleAddToCart = () => {
        if (!selectedSize && product.sizes.length > 0) {
            alert('Please select a size');
            return;
        }

        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            size: selectedSize,
            color: selectedColor.name,
            quantity,
        });

        setShowAddedToast(true);
        setTimeout(() => setShowAddedToast(false), 3000);
    };

    const handleWishlistToggle = () => {
        if (isWishlisted) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                category: product.category,
            });
        }
    };

    return (
        <main className="min-h-screen bg-white">
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
                        <span className="text-gray-900">{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* Product Details */}
            <section className="py-8 lg:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image Gallery */}
                        <ProductGallery
                            images={product.images}
                            productName={product.name}
                            isNew={product.isNew}
                            isSale={product.isSale}
                            discount={discount}
                            isWishlisted={isWishlisted}
                            onWishlistToggle={handleWishlistToggle}
                        />

                        {/* Product Info */}
                        <div className="lg:py-4">
                            <div className="sticky top-32">
                                {/* Category */}
                                <Link href={`/category/${product.categorySlug}`} className="text-sm text-rose-600 font-medium tracking-wider uppercase hover:text-rose-700 transition-colors">
                                    {product.category}
                                </Link>

                                {/* Title */}
                                <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-gray-900">{product.name}</h1>

                                {/* Price */}
                                <div className="mt-4 flex items-baseline gap-3">
                                    <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                                    {product.originalPrice && (
                                        <>
                                            <span className="text-lg text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-sm font-medium rounded">Save {discount}%</span>
                                        </>
                                    )}
                                </div>

                                {/* Short Description */}
                                <p className="mt-4 text-gray-600 leading-relaxed">{product.shortDescription}</p>

                                <ColorSelector
                                    colors={product.colors}
                                    selectedColor={selectedColor}
                                    onSelect={setSelectedColor}
                                />

                                <SizeSelector
                                    sizes={product.sizes}
                                    selectedSize={selectedSize}
                                    onSelect={setSelectedSize}
                                    onSizeGuideClick={() => setIsSizeGuideOpen(true)}
                                />

                                <QuantitySelector
                                    quantity={quantity}
                                    setQuantity={setQuantity}
                                />

                                <ProductActions
                                    price={product.price}
                                    quantity={quantity}
                                    onAddToCart={handleAddToCart}
                                    product={{
                                        id: product.id,
                                        name: product.name,
                                        price: product.price,
                                        image: product.images[0],
                                        category: product.category,
                                        slug: product.categorySlug,
                                    }}
                                />

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
                                <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Details Tabs */}
            <ProductTabs description={product.description} features={product.features} />

            {/* User Reviews */}
            <section className="py-16 border-t border-gray-100 bg-white" id="reviews">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl">
                                <h3 className="font-semibold text-slate-900 mb-2">Have you bought this?</h3>
                                <p className="text-sm text-slate-600 mb-6">Share your thoughts with other customers.</p>
                                <ReviewForm productId={product.id} />
                            </div>
                        </div>
                        <div className="lg:col-span-8">
                            <ReviewList reviews={reviews} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            <RelatedProducts products={relatedProducts} />

            {/* Added to Cart Toast */}
            <AddToCartToast isVisible={showAddedToast} />

            <SizeGuideModal
                isOpen={isSizeGuideOpen}
                onClose={() => setIsSizeGuideOpen(false)}
                defaultCategory={
                    product.category.toLowerCase().includes('men') ? 'mens-tops' :
                        product.category.toLowerCase().includes('women') ? 'womens-tops' : 'mens-tops'
                }
            />

            <RecentlyViewed />
        </main>
    );
}
