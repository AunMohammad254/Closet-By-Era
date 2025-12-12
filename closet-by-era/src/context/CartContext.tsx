'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    image: string;
    size?: string;
    color?: string;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('closet-by-era-cart');
        if (savedCart) {
            setItems(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        localStorage.setItem('closet-by-era-cart', JSON.stringify(items));
    }, [items]);

    const addItem = (item: Omit<CartItem, 'id'>) => {
        setItems((prev) => {
            // Check if item already exists with same size and color
            const existingIndex = prev.findIndex(
                (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
            );

            if (existingIndex > -1) {
                // Update quantity
                const updated = [...prev];
                updated[existingIndex].quantity += item.quantity;
                return updated;
            }

            // Add new item
            return [...prev, { ...item, id: `${item.productId}-${item.size}-${item.color}-${Date.now()}` }];
        });
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id);
            return;
        }
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
