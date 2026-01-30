'use client';

import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import TopBanner from './navbar/TopBanner';
import DesktopNav from './navbar/DesktopNav';
import NavIcons from './navbar/NavIcons';
import SearchBar from './navbar/SearchBar';
import MobileMenu from './navbar/MobileMenu';

// Dynamic import to reduce initial bundle size (~9KB saved)
const AIStylistModal = dynamic(() => import('./AIStylistModal'), {
    ssr: false,
    loading: () => null
});

const AIStylistTrigger = dynamic(() => import('./AIStylistTrigger'), {
    ssr: false
});

interface NavbarProps {
    announcement?: string;
}

export default function Navbar({ announcement }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isStylistOpen, setIsStylistOpen] = useState(false);
    const { itemCount } = useCart();
    const { user } = useAuth();

    const categories = [
        { name: 'Women', href: '/women' },
        { name: 'Men', href: '/men' },
        { name: 'Accessories', href: '/accessories' },
        { name: 'Sale', href: '/sale' },
    ];
    // ... (rest of the file) stays same until return

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
                <TopBanner text={announcement} />

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
                        <Link href="/" className="shrink-0">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                <span className="font-light">CLOSET</span>
                                <span className="text-rose-600">BY</span>
                                <span className="font-light">ERA</span>
                            </h1>
                        </Link>

                        <DesktopNav categories={categories} />

                        <NavIcons
                            itemCount={itemCount}
                            isSearchOpen={isSearchOpen}
                            onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
                        />
                    </div>

                    <SearchBar isOpen={isSearchOpen} />
                </nav>

                <MobileMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    categories={categories}
                    onStylistOpen={() => setIsStylistOpen(true)}
                    user={user}
                />

            </header>
            <AIStylistTrigger />
            <AIStylistModal isOpen={isStylistOpen} onClose={() => setIsStylistOpen(false)} />
        </>
    );
}
