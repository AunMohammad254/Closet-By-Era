'use client';

import Link from 'next/link';
import CurrencySwitcher from '../CurrencySwitcher';

interface NavIconsProps {
    itemCount: number;
    isSearchOpen: boolean;
    onSearchToggle: () => void;
}

export default function NavIcons({ itemCount, isSearchOpen, onSearchToggle }: NavIconsProps) {
    return (
        <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
                <CurrencySwitcher />
            </div>

            {/* Search */}
            <button
                onClick={onSearchToggle}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Search"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Account */}
            <Link
                href="/profile"
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
    );
}
