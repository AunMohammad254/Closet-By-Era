'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    isNew?: boolean;
    isSale?: boolean;
}

export default function ProductCard({
    id,
    name,
    price,
    originalPrice,
    image,
    category,
    isNew = false,
    isSale = false,
}: ProductCardProps) {
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
    const { addItem: addToCart } = useCart();
    const [showToast, setShowToast] = useState(false);

    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    const isWishlisted = isInWishlist(id);

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isWishlisted) {
            removeFromWishlist(id);
        } else {
            addToWishlist({ id, name, price, image, category });
        }
    };

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addToCart({
            productId: id,
            name,
            price,
            image,
            size: 'M',
            color: 'Default',
            quantity: 1,
        });

        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
        <article className="group relative">
            {/* Image Container */}
            <Link href={`/product/${id}`} className="block relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                {/* Product Image */}
                {image && image.startsWith('/products/') ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Quick Actions */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <button
                        onClick={handleQuickAdd}
                        className="flex-1 py-3 bg-white text-slate-900 text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors shadow-lg"
                    >
                        Quick Add
                    </button>
                    <button
                        onClick={handleWishlistToggle}
                        className={`p-3 rounded-lg shadow-lg transition-colors ${isWishlisted
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-white text-slate-900 hover:bg-rose-50'
                            }`}
                    >
                        <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {isNew && (
                        <span className="px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full tracking-wide">
                            NEW
                        </span>
                    )}
                    {isSale && discount > 0 && (
                        <span className="px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-full tracking-wide">
                            -{discount}%
                        </span>
                    )}
                </div>
            </Link>

            {/* Product Info */}
            <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{category}</p>
                <h3 className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                    <Link href={`/product/${id}`}>{name}</Link>
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                        PKR {price.toLocaleString()}
                    </span>
                    {originalPrice && originalPrice > price && (
                        <span className="text-sm text-gray-400 line-through">
                            PKR {originalPrice.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Added Toast */}
            {showToast && (
                <div className="absolute top-4 right-4 z-10 px-3 py-2 bg-emerald-500 text-white text-xs rounded-lg shadow-lg animate-fade-in">
                    Added to cart!
                </div>
            )}
        </article>
    );
}
