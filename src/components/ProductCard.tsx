'use client';

import { useCurrency } from '@/context/CurrencyContext';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useCartActions } from '@/context/CartContext';
import { useState, memo } from 'react';
import { canOptimizeImage, isDisplayableImage, shimmerPlaceholder } from '@/lib/imageUtils';

interface ProductCardProps {
    id: string;
    slug?: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    isNew?: boolean;
    isSale?: boolean;
}

function ProductCard({
    id,
    slug,
    name,
    price,
    originalPrice,
    image,
    category,
    isNew = false,
    isSale = false,
}: ProductCardProps) {
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
    const { addItem: addToCart } = useCartActions();
    const { formatPrice } = useCurrency();
    const [showToast, setShowToast] = useState(false);

    // Fallback: use id if slug is not provided (legacy support, though we should migrate all)
    const productLink = slug ? `/product/${slug}` : `/product/${id}`;

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
            // No size/colour is chosen on a card; never invent one.
            size: '',
            color: '',
            quantity: 1,
        });

        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
        <article className="group relative">
            {/* Image Container */}
            <Link href={productLink} className="block relative aspect-3/4 overflow-hidden rounded-xl bg-secondary">
                {/* Product Image */}
                {isDisplayableImage(image) ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        placeholder="blur"
                        blurDataURL={shimmerPlaceholder(500, 600)}
                        unoptimized={!canOptimizeImage(image)}
                    />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-secondary via-muted to-secondary flex items-center justify-center">
                        <svg className="w-16 h-16 text-muted-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Quick Actions */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300">
                    <button
                        type="button"
                        onClick={handleQuickAdd}
                        aria-label={`Quick Add ${name}`}
                        className="flex-1 py-3 bg-card text-card-foreground text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors shadow-lg"
                    >
                        Quick Add
                    </button>
                    <button
                        type="button"
                        onClick={handleWishlistToggle}
                        aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
                        aria-pressed={isWishlisted}
                        className={`p-3 rounded-lg shadow-lg transition-colors ${isWishlisted
                            ? 'bg-primary/10 text-primary'
                            : 'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'
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
                        <span className="px-3 py-1 bg-foreground text-background text-xs font-medium rounded-full tracking-wide">
                            NEW
                        </span>
                    )}
                    {isSale && discount > 0 && (
                        <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full tracking-wide">
                            -{discount}%
                        </span>
                    )}
                </div>
            </Link>

            {/* Product Info */}
            <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{category}</p>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    <Link href={productLink}>{name}</Link>
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">
                        {formatPrice(price)}
                    </span>
                    {originalPrice && originalPrice > price && (
                        <span className="text-sm text-muted-foreground/60 line-through">
                            {formatPrice(originalPrice)}
                        </span>
                    )}
                </div>
            </div>

            {/* Added Toast */}
            {showToast && (
                <div role="status" className="absolute top-4 right-4 z-10 px-3 py-2 bg-emerald-500 text-white text-xs rounded-lg shadow-lg animate-fade-in">
                    Added to cart!
                </div>
            )}
        </article>
    );
}

// Memoize to prevent re-renders when props haven't changed
export default memo(ProductCard);
