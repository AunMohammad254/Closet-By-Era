'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProductGalleryProps {
    images: string[];
    productName: string;
    isNew?: boolean;
    isSale?: boolean;
    discount?: number;
    isWishlisted: boolean;
    onWishlistToggle: () => void;
}

export default function ProductGallery({
    images,
    productName,
    isNew,
    isSale,
    discount = 0,
    isWishlisted,
    onWishlistToggle
}: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
                {images.length > 0 && (
                    <Image
                        src={images[selectedImage]}
                        alt={productName}
                        fill
                        className="object-cover"
                        priority
                    />
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {isNew && (
                        <span className="px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">NEW</span>
                    )}
                    {isSale && discount > 0 && (
                        <span className="px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-full">-{discount}%</span>
                    )}
                </div>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="absolute top-4 right-16 w-10 h-10 bg-white text-gray-600 hover:text-slate-900 rounded-full flex items-center justify-center z-10 transition-all shadow-sm border border-gray-100"
                    title="Share Product"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>

                {/* Wishlist Button */}
                <button
                    onClick={onWishlistToggle}
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
                {images.map((img, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all ${selectedImage === index ? 'ring-2 ring-slate-900' : 'hover:opacity-80'
                            }`}
                    >
                        <div className="relative w-full h-full">
                            <Image
                                src={img}
                                alt={`${productName} view ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
