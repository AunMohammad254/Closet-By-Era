'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
    const { items, removeItem, updateQuantity, subtotal, itemCount, clearCart } = useCart();

    const shipping = subtotal >= 5000 ? 0 : 500;
    const total = subtotal + shipping;

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-white">

                <section className="pt-32 pb-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md mx-auto text-center py-20">
                            {/* Empty Cart Icon */}
                            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-8">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                            <p className="text-gray-600 mb-8">
                                Looks like you haven&apos;t added anything to your cart yet.
                            </p>

                            <Link
                                href="/products"
                                className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                            >
                                Start Shopping
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
                        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                        <p className="text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="space-y-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 rounded-2xl">
                                        {/* Product Image */}
                                        <div className="w-24 h-32 sm:w-32 sm:h-40 bg-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                                                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                                        {item.size && <span>Size: {item.size}</span>}
                                                        {item.color && <span>Color: {item.color}</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="mt-auto pt-4 flex items-center justify-between">
                                                {/* Quantity */}
                                                <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                        </svg>
                                                    </button>
                                                    <span className="px-3 py-1.5 text-sm font-medium text-gray-900">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Price */}
                                                <span className="font-semibold text-gray-900">
                                                    PKR {(item.price * item.quantity).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Clear Cart */}
                            <button
                                onClick={clearCart}
                                className="mt-6 text-sm text-gray-500 hover:text-rose-600 transition-colors"
                            >
                                Clear cart
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-32 p-6 bg-gray-50 rounded-2xl">
                                <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

                                {/* Coupon Code */}
                                <div className="mb-6">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Coupon code"
                                            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        />
                                        <button className="px-4 py-3 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">
                                            Apply
                                        </button>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium text-gray-900">PKR {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-medium text-gray-900">
                                            {shipping === 0 ? (
                                                <span className="text-emerald-600">Free</span>
                                            ) : (
                                                `PKR ${shipping.toLocaleString()}`
                                            )}
                                        </span>
                                    </div>
                                    {subtotal < 5000 && (
                                        <p className="text-xs text-gray-500">
                                            Add PKR {(5000 - subtotal).toLocaleString()} more for free shipping
                                        </p>
                                    )}
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-900">Total</span>
                                            <span className="text-lg font-bold text-gray-900">PKR {total.toLocaleString()}</span>
                                        </div>
                                        <div className="mt-2 text-right">
                                            <span className="text-xs text-rose-600 font-medium">
                                                You will earn {Math.floor(total / 100)} loyalty points
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Checkout Button */}
                                <Link
                                    href="/checkout"
                                    className="mt-6 w-full flex items-center justify-center py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                                >
                                    Proceed to Checkout
                                </Link>

                                {/* Continue Shopping */}
                                <Link
                                    href="/products"
                                    className="mt-4 w-full flex items-center justify-center py-3 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                                >
                                    Continue Shopping
                                </Link>

                                {/* Trust Badges */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center justify-center gap-4 text-gray-400">
                                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6.3 1 .9 1 1.6V17c0 1-.8 1.8-1.8 1.8h-4c-1 0-1.8-.8-1.8-1.8v-4.4c0-.7.4-1.3 1-1.6V9.5c0-1.4 1.4-2.5 2.8-2.5zm0 1.2c-.8 0-1.5.7-1.5 1.5V11h3V9.7c0-.8-.7-1.5-1.5-1.5z" />
                                        </svg>
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2v2H4V6h16zm-16 12v-6h16v6H4z" />
                                        </svg>
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                    <p className="mt-2 text-center text-xs text-gray-500">Secure checkout guaranteed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
