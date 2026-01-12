'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ProductSummary {
    id: string;
    name: string;
    image: string;
    price: number;
    category: string;
    slug: string;
}

interface CompareContextType {
    items: ProductSummary[];
    addToCompare: (product: ProductSummary) => void;
    removeFromCompare: (productId: string) => void;
    clearCompare: () => void;
    isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ProductSummary[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('compare_items');
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load compare items', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('compare_items', JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCompare = (product: ProductSummary) => {
        // Limit to 4 items
        if (items.length >= 4) {
            alert('You can only compare up to 4 products at a time.');
            return;
        }

        // Prevent duplicates
        if (items.some(item => item.id === product.id)) {
            return;
        }

        // Check category mismatch? Optional but good UX. 
        // For now allowing cross-category comparison but maybe warn user?
        // Simplicity: allow all.

        setItems(prev => [...prev, product]);
    };

    const removeFromCompare = (productId: string) => {
        setItems(prev => prev.filter(item => item.id !== productId));
    };

    const clearCompare = () => {
        setItems([]);
    };

    const isInCompare = (productId: string) => {
        return items.some(item => item.id === productId);
    };

    return (
        <CompareContext.Provider value={{ items, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    const context = useContext(CompareContext);
    if (context === undefined) {
        throw new Error('useCompare must be used within a CompareProvider');
    }
    return context;
}
