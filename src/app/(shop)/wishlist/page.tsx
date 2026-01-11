'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

export default function WishlistPage() {
    const { items, removeItem, clearWishlist } = useWishlist();
    const { addItem } = useCart();

    const handleAddToCart = (item: typeof items[0]) => {
        addItem({
            productId: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            size: 'M', // Default size
            color: 'Default',
            quantity: 1,
        });
        removeItem(item.id);
    };

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-white">

                <section className="pt-32 pb-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md mx-auto text-center py-20">
                            {/* Empty Wishlist Icon */}
                            <div className="w-24 h-24 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-8">
                                <svg className="w-12 h-12 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h1>
                            <p className="text-gray-600 mb-8">
                                Save items you love to your wishlist and come back to them later.
                            </p>

                            <Link
                                href="/products"
                                className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                            >
                                Discover Products
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>

            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">

            <section className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                            <p className="mt-1 text-gray-500">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
                        </div>
                        <button
                            onClick={clearWishlist}
                            className="text-sm text-gray-500 hover:text-rose-600 transition-colors"
                        >
                            Clear all
                        </button>
                    </div>

                    {/* Wishlist Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                        {items.map((item) => (
                            <article key={item.id} className="group relative">
                                {/* Image Container */}
                                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-rose-600 shadow-md transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    {/* Add to Cart Button */}
                                    <div className="absolute bottom-4 left-4 right-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            className="w-full py-3 bg-white text-slate-900 text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors shadow-lg"
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>
                                    <h3 className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                                        <Link href={`/product/${item.id}`}>{item.name}</Link>
                                    </h3>
                                    <p className="text-lg font-semibold text-gray-900">
                                        PKR {item.price.toLocaleString()}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    );
}
