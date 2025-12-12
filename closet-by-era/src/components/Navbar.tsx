'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { itemCount } = useCart();
    const { user } = useAuth();

    const categories = [
        { name: 'Women', href: '/women' },
        { name: 'Men', href: '/men' },
        { name: 'Accessories', href: '/accessories' },
        { name: 'Sale', href: '/sale' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-center py-2 text-xs tracking-widest font-light">
                FREE SHIPPING ON ORDERS OVER PKR 5,000 | USE CODE: <span className="font-medium">ERA20</span>
            </div>

            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            <span className="font-light">CLOSET</span>
                            <span className="text-rose-600">BY</span>
                            <span className="font-light">ERA</span>
                        </h1>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {categories.map((category) => (
                            <Link
                                key={category.name}
                                href={category.href}
                                className="text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors tracking-wide relative group"
                            >
                                {category.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-600 transition-all duration-300 group-hover:w-full" />
                            </Link>
                        ))}
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center space-x-4">
                        {/* Search */}
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                            aria-label="Search"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        {/* Account */}
                        <Link
                            href={user ? "/account" : "/auth/login"}
                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </Link>

                        {/* Wishlist */}
                        <Link href="/wishlist" className="p-2 text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </Link>

                        {/* Cart */}
                        <Link href="/cart" className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                    {itemCount > 9 ? '9+' : itemCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Search Bar */}
                <div className={`overflow-hidden transition-all duration-300 ${isSearchOpen ? 'max-h-16 pb-4' : 'max-h-0'}`}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search for products..."
                            className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                        />
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`lg:hidden overflow-hidden transition-all duration-300 bg-white border-t border-gray-100 ${isMenuOpen ? 'max-h-64' : 'max-h-0'}`}>
                <div className="px-4 py-4 space-y-3">
                    {categories.map((category) => (
                        <Link
                            key={category.name}
                            href={category.href}
                            className="block py-2 text-base font-medium text-gray-700 hover:text-rose-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {category.name}
                        </Link>
                    ))}
                    <div className="pt-4 border-t border-gray-100">
                        <Link
                            href={user ? "/account" : "/auth/login"}
                            className="block py-2 text-base font-medium text-gray-700 hover:text-rose-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {user ? 'My Account' : 'Sign In'}
                        </Link>
                        <Link
                            href="/wishlist"
                            className="block py-2 text-base font-medium text-gray-700 hover:text-rose-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Wishlist
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
