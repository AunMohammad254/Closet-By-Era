'use client';

import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import ThemeToggle from '@/components/ThemeToggle';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    categories: { name: string; href: string }[];
    onStylistOpen: () => void;
    user: User | null;
}

export default function MobileMenu({ isOpen, onClose, categories, onStylistOpen, user }: MobileMenuProps) {
    return (
        <div className={`lg:hidden overflow-hidden transition-all duration-300 bg-background border-t border-border ${isOpen ? 'max-h-64' : 'max-h-0'}`}>
            <div className="px-4 py-4 space-y-3">
                {categories.map((category) => (
                    <Link
                        key={category.name}
                        href={category.href}
                        className="block py-2 text-base font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={onClose}
                    >
                        {category.name}
                    </Link>
                ))}
                <button
                    onClick={() => { onStylistOpen(); onClose(); }}
                    className="w-full text-left py-2 text-base font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors flex items-center gap-2"
                >
                    <span>✨</span> AI Stylist
                </button>
                <div className="pt-4 border-t border-border">
                    <Link
                        href="/profile"
                        className="block py-2 text-base font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={onClose}
                    >
                        {user ? 'My Account' : 'Sign In'}
                    </Link>
                    <Link
                        href="/wishlist"
                        className="block py-2 text-base font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={onClose}
                    >
                        Wishlist
                    </Link>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-base font-medium text-muted-foreground">Theme</span>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </div>
    );
}
