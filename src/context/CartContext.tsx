'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import type { Tables } from '@/types/supabase';

// Database cart item type from Supabase
type DBCartItem = Tables<'cart_items'>;

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    color: string;
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

const CART_STORAGE_KEY = 'closet-by-era-cart';
const MAX_CART_ITEMS = 100;

/** Normalize size/color to never be null/undefined — always a string */
const norm = (val: string | null | undefined): string => val ?? '';

/** Validate that a parsed object looks like a CartItem array */
function isValidCartArray(data: unknown): data is CartItem[] {
    if (!Array.isArray(data)) return false;
    if (data.length > MAX_CART_ITEMS) return false; // reject corrupted data
    return data.every(
        (item) =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.productId === 'string' &&
            typeof item.name === 'string' &&
            typeof item.price === 'number' &&
            typeof item.quantity === 'number'
    );
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user } = useAuth();

    // Guards to prevent sync feedback loops
    const isSyncingRef = useRef(false);
    const hasMergedRef = useRef(false);

    // ---------- DB sync helpers ----------

    /** Write the full cart state to Supabase (replace strategy) */
    const syncCartToDB = useCallback(async (cartItems: CartItem[]) => {
        if (!user) return;

        try {
            // Always delete first, then insert — simple and no NULL/upsert issues
            await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id);

            if (cartItems.length === 0) return;

            const dbItems = cartItems.map(item => ({
                user_id: user.id,
                product_id: item.productId,
                product_name: item.name,
                product_price: item.price,
                product_image: item.image,
                size: norm(item.size),
                color: norm(item.color),
                quantity: item.quantity,
            }));

            await supabase.from('cart_items').insert(dbItems);
        } catch (error) {
            console.error('Error syncing cart to database:', error);
        }
    }, [user, supabase]);

    /** Fetch cart from database (DB is source of truth for logged-in users) */
    const syncCartFromDB = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('id, product_id, product_name, product_price, product_image, size, color, quantity')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching cart from database:', error);
                return;
            }

            const cartItems: CartItem[] = (data || []).map((item) => ({
                id: item.id,
                productId: item.product_id,
                name: item.product_name,
                price: item.product_price,
                image: item.product_image || '',
                size: norm(item.size),
                color: norm(item.color),
                quantity: item.quantity,
            }));

            // Update state without triggering a sync-back
            isSyncingRef.current = true;
            setItems(cartItems);
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
            // Reset flag after React processes the state update
            setTimeout(() => { isSyncingRef.current = false; }, 0);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, supabase]);

    // ---------- Initialization ----------

    // Load cart from localStorage on mount (guests + initial load before auth resolves)
    useEffect(() => {
        if (isInitialized) return;

        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (isValidCartArray(parsed)) {
                    // Normalize all items on load
                    const normalized = parsed.map(item => ({
                        ...item,
                        size: norm(item.size),
                        color: norm(item.color),
                    }));
                    setItems(normalized);
                } else {
                    console.warn('Cart data in localStorage was corrupted, clearing.');
                    localStorage.removeItem(CART_STORAGE_KEY);
                }
            } catch {
                console.error('Error parsing saved cart, clearing.');
                localStorage.removeItem(CART_STORAGE_KEY);
            }
        }
        setIsInitialized(true);
    }, [isInitialized]);

    // When user logs in, merge local cart with database cart (runs ONCE per login)
    useEffect(() => {
        if (!user || !isInitialized || hasMergedRef.current) return;
        hasMergedRef.current = true;

        const mergeAndSync = async () => {
            setIsLoading(true);
            isSyncingRef.current = true;
            try {
                const { data: dbCartData } = await supabase
                    .from('cart_items')
                    .select('id, product_id, product_name, product_price, product_image, size, color, quantity')
                    .eq('user_id', user.id);

                const localCart = items;
                const mergedCart: CartItem[] = [...localCart];

                if (dbCartData && dbCartData.length > 0) {
                    dbCartData.forEach((dbItem) => {
                        const dbSize = norm(dbItem.size);
                        const dbColor = norm(dbItem.color);

                        const exists = mergedCart.some(
                            item => item.productId === dbItem.product_id &&
                                norm(item.size) === dbSize &&
                                norm(item.color) === dbColor
                        );

                        if (!exists) {
                            mergedCart.push({
                                id: dbItem.id,
                                productId: dbItem.product_id,
                                name: dbItem.product_name,
                                price: dbItem.product_price,
                                image: dbItem.product_image || '',
                                size: dbSize,
                                color: dbColor,
                                quantity: dbItem.quantity,
                            });
                        }
                    });
                }

                // Cap the cart to prevent runaway
                const capped = mergedCart.slice(0, MAX_CART_ITEMS);

                setItems(capped);
                await syncCartToDB(capped);
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(capped));
            } catch (error) {
                console.error('Error merging carts:', error);
            } finally {
                setIsLoading(false);
                // Allow items watcher to work again after merge is fully done
                setTimeout(() => { isSyncingRef.current = false; }, 0);
            }
        };

        mergeAndSync();
    }, [user, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset merge flag when user logs out
    useEffect(() => {
        if (!user) {
            hasMergedRef.current = false;
        }
    }, [user]);

    // Persist to localStorage + debounced DB sync on items change
    useEffect(() => {
        if (!isInitialized) return;
        // Skip if this change was caused by a DB sync (prevents feedback loop)
        if (isSyncingRef.current) return;

        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

        const timeoutId = setTimeout(() => {
            if (user) {
                syncCartToDB(items);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [items, user, syncCartToDB, isInitialized]);

    // ---------- Cart actions ----------

    const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
        setItems((prev) => {
            // Safety cap
            if (prev.length >= MAX_CART_ITEMS) {
                console.warn('Cart is full, cannot add more items.');
                return prev;
            }

            const normalizedSize = norm(item.size);
            const normalizedColor = norm(item.color);

            const existingIndex = prev.findIndex(
                (i) => i.productId === item.productId &&
                    norm(i.size) === normalizedSize &&
                    norm(i.color) === normalizedColor
            );

            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + item.quantity,
                };
                return updated;
            }

            return [...prev, {
                ...item,
                size: normalizedSize,
                color: normalizedColor,
                id: `${item.productId}-${normalizedSize || 'default'}-${normalizedColor || 'default'}-${Date.now()}`,
            }];
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
        localStorage.removeItem(CART_STORAGE_KEY);

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
    }, [user, supabase]);

    // ---------- Computed values ----------

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const contextValue = useMemo(() => ({
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isLoading,
        syncCartFromDB,
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
