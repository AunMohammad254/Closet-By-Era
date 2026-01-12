'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

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
    isLoading: boolean;
    syncCartFromDB: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user } = useAuth();

    // Generate unique cart item ID
    const generateCartItemId = (productId: string, size?: string, color?: string) => {
        return `${productId}-${size || 'default'}-${color || 'default'}-${Date.now()}`;
    };

    // Sync cart to database
    const syncCartToDB = useCallback(async (cartItems: CartItem[]) => {
        if (!user) return;

        try {
            // Delete existing cart items for this user
            await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id);

            // Insert new cart items
            if (cartItems.length > 0) {
                const dbItems = cartItems.map(item => ({
                    user_id: user.id,
                    product_id: item.productId,
                    product_name: item.name,
                    product_price: item.price,
                    product_image: item.image,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                }));

                await supabase.from('cart_items').insert(dbItems);
            }
        } catch (error) {
            console.error('Error syncing cart to database:', error);
        }
    }, [user]);

    // Fetch cart from database
    const syncCartFromDB = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching cart from database:', error);
                return;
            }

            if (data && data.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const cartItems: CartItem[] = data.map((item: any) => ({
                    id: item.id,
                    productId: item.product_id,
                    name: item.product_name,
                    price: item.product_price,
                    image: item.product_image,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                }));
                setItems(cartItems);
                // Also save to localStorage as backup
                localStorage.setItem('closet-by-era-cart', JSON.stringify(cartItems));
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Load cart from localStorage on mount (for guests and initial load)
    useEffect(() => {
        if (isInitialized) return;

        const savedCart = localStorage.getItem('closet-by-era-cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                setItems(parsedCart);
            } catch (error) {
                console.error('Error parsing saved cart:', error);
            }
        }
        setIsInitialized(true);
    }, [isInitialized]);

    // When user logs in, merge local cart with database cart
    useEffect(() => {
        if (user && isInitialized) {
            const mergeAndSyncCart = async () => {
                setIsLoading(true);
                try {
                    // Fetch existing cart from database
                    const { data: dbCartData } = await supabase
                        .from('cart_items')
                        .select('*')
                        .eq('user_id', user.id);

                    // Get local cart
                    const localCart = items;

                    // Merge carts (local cart takes precedence for newer items)
                    const mergedCart: CartItem[] = [...localCart];

                    if (dbCartData && dbCartData.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        dbCartData.forEach((dbItem: any) => {
                            const existingIndex = mergedCart.findIndex(
                                item => item.productId === dbItem.product_id &&
                                    item.size === dbItem.size &&
                                    item.color === dbItem.color
                            );

                            if (existingIndex === -1) {
                                // Add item from database that's not in local cart
                                mergedCart.push({
                                    id: dbItem.id,
                                    productId: dbItem.product_id,
                                    name: dbItem.product_name,
                                    price: dbItem.product_price,
                                    image: dbItem.product_image,
                                    size: dbItem.size,
                                    color: dbItem.color,
                                    quantity: dbItem.quantity,
                                });
                            }
                        });
                    }

                    setItems(mergedCart);
                    // Sync merged cart back to database
                    await syncCartToDB(mergedCart);
                    localStorage.setItem('closet-by-era-cart', JSON.stringify(mergedCart));
                } catch (error) {
                    console.error('Error merging carts:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            mergeAndSyncCart();
        }
    }, [user, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

    // Save cart to localStorage on change (and sync to DB if logged in)
    useEffect(() => {
        if (!isInitialized) return;

        localStorage.setItem('closet-by-era-cart', JSON.stringify(items));

        // Debounce database sync
        const timeoutId = setTimeout(() => {
            if (user) {
                syncCartToDB(items);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [items, user, syncCartToDB, isInitialized]);

    const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
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
            return [...prev, { ...item, id: generateCartItemId(item.productId, item.size, item.color) }];
        });
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const updateQuantity = useCallback((id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id);
            return;
        }
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    }, [removeItem]);

    const clearCart = useCallback(async () => {
        setItems([]);
        localStorage.removeItem('closet-by-era-cart');

        if (user) {
            try {
                await supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', user.id);
            } catch (error) {
                console.error('Error clearing cart from database:', error);
            }
        }
    }, [user]);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isLoading,
        syncCartFromDB
    }), [items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, isLoading, syncCartFromDB]);

    return (
        <CartContext.Provider value={contextValue}>
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
