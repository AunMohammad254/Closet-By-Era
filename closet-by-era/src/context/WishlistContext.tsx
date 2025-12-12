'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
}

interface WishlistContextType {
    items: WishlistItem[];
    addItem: (item: WishlistItem) => void;
    removeItem: (id: string) => void;
    isInWishlist: (id: string) => boolean;
    clearWishlist: () => void;
    itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('closet-by-era-wishlist');
        if (saved) {
            setItems(JSON.parse(saved));
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('closet-by-era-wishlist', JSON.stringify(items));
    }, [items]);

    const addItem = (item: WishlistItem) => {
        setItems((prev) => {
            if (prev.find((i) => i.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const isInWishlist = (id: string) => items.some((item) => item.id === id);

    const clearWishlist = () => setItems([]);

    const itemCount = items.length;

    return (
        <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist, clearWishlist, itemCount }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
