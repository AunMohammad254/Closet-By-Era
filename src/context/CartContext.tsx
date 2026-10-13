'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
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

interface CartActionsType {
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
}

interface CartContextType extends CartActionsType {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    isLoading: boolean;
    syncCartFromDB: () => Promise<void>;
}

const CART_STORAGE_KEY = 'closet-by-era-cart';
const MAX_CART_ITEMS = 100;

/** Normalize size/color to never be null/undefined — always a string */
const norm = (val: string | null | undefined): string => val ?? '';

/** Identifies the rows a cart is stored as (order-independent): equal keys need no write. */
function cartKey(cartItems: CartItem[]): string {
    return cartItems
        .map(i => JSON.stringify([i.productId, norm(i.size), norm(i.color), i.quantity, i.price, i.name, i.image]))
        .sort()
        .join('\n');
}

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
const CartActionsContext = createContext<CartActionsType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user } = useAuth();
    // Depend on the id, not the User object: Supabase hands out a new object on
    // every token refresh, which would otherwise re-run the DB sync.
    const userId = user?.id ?? null;

    // Guards to prevent sync feedback loops
    const isSyncingRef = useRef(false);
    const hasMergedRef = useRef(false);
    // Key of the cart the database is known to hold: an equal cart needs no write.
    const syncedKeyRef = useRef<string | null>(null);
    // Writes run one at a time, so two delete-then-insert rounds never interleave.
    const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

    // ---------- DB sync helpers ----------

    /** Write the full cart state to Supabase (replace strategy) */
    const syncCartToDB = useCallback((cartItems: CartItem[]): Promise<void> => {
        if (!userId) return Promise.resolve();

        const write = async () => {
            const key = cartKey(cartItems);
            if (key === syncedKeyRef.current) return;

            try {
                // Always delete first, then insert — simple and no NULL/upsert issues
                const { error: deleteError } = await supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', userId);

                // Never insert on top of rows we failed to clear (would duplicate the cart).
                if (deleteError) throw deleteError;

                if (cartItems.length > 0) {
                    const dbItems = cartItems.map(item => ({
                        user_id: userId,
                        product_id: item.productId,
                        product_name: item.name,
                        product_price: item.price,
                        product_image: item.image,
                        size: norm(item.size),
                        color: norm(item.color),
                        quantity: item.quantity,
                    }));

                    const { error: insertError } = await supabase.from('cart_items').insert(dbItems);
                    if (insertError) throw insertError;
                }
                syncedKeyRef.current = key;
            } catch (error) {
                console.error('Error syncing cart to database:', error);
            }
        };

        syncQueueRef.current = syncQueueRef.current.then(write);
        return syncQueueRef.current;
    }, [userId, supabase]);

    /** Fetch cart from database (DB is source of truth for logged-in users) */
    const syncCartFromDB = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('id, product_id, product_name, product_price, product_image, size, color, quantity')
                .eq('user_id', userId);

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
            syncedKeyRef.current = cartKey(cartItems);
            setItems(cartItems);
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
            // Reset flag after React processes the state update
            setTimeout(() => { isSyncingRef.current = false; }, 0);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, supabase]);

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
        if (!userId || !isInitialized || hasMergedRef.current) return;
        hasMergedRef.current = true;

        const mergeAndSync = async () => {
            setIsLoading(true);
            isSyncingRef.current = true;
            try {
                const { data: dbCartData, error: dbCartError } = await supabase
                    .from('cart_items')
                    .select('id, product_id, product_name, product_price, product_image, size, color, quantity')
                    .eq('user_id', userId);
                // Without the saved cart, writing the local one would replace it.
                if (dbCartError) throw dbCartError;

                const dbCart: CartItem[] = (dbCartData ?? []).map((dbItem) => ({
                    id: dbItem.id,
                    productId: dbItem.product_id,
                    name: dbItem.product_name,
                    price: dbItem.product_price,
                    image: dbItem.product_image || '',
                    size: norm(dbItem.size),
                    color: norm(dbItem.color),
                    quantity: dbItem.quantity,
                }));
                syncedKeyRef.current = cartKey(dbCart);

                const localCart = items;
                const mergedCart: CartItem[] = [...localCart];

                dbCart.forEach((dbItem) => {
                    const exists = mergedCart.some(
                        item => item.productId === dbItem.productId &&
                            norm(item.size) === dbItem.size &&
                            norm(item.color) === dbItem.color
                    );

                    if (!exists) {
                        mergedCart.push(dbItem);
                    }
                });

                // Cap the cart to prevent runaway
                const capped = mergedCart.slice(0, MAX_CART_ITEMS);

                setItems(capped);
                // Usually the local cart already mirrors the account's, and this is a
                // no-op; it writes only when merging changed it (e.g. a guest cart was added).
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
    }, [userId, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset merge flag when user logs out
    useEffect(() => {
        if (!userId) {
            hasMergedRef.current = false;
            syncedKeyRef.current = null;
        }
    }, [userId]);

    // Persist to localStorage + debounced DB sync on items change
    useEffect(() => {
        if (!isInitialized) return;
        // Skip if this change was caused by a DB sync (prevents feedback loop)
        if (isSyncingRef.current) return;

        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

        if (!userId || cartKey(items) === syncedKeyRef.current) return;
        const timeoutId = setTimeout(() => {
            syncCartToDB(items);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [items, userId, syncCartToDB, isInitialized]);

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
        // Always delete the saved cart (after any write still in flight), even if this
        // tab thinks it is empty: another tab may have saved one. No-op when signed out.
        syncedKeyRef.current = null;
        await syncCartToDB([]);
    }, [syncCartToDB]);

    // ---------- Computed values ----------

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const actions = useMemo(() => ({
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
    }), [addItem, removeItem, updateQuantity, clearCart]);

    const contextValue = useMemo(() => ({
        ...actions,
        items,
        itemCount,
        subtotal,
        isLoading,
        syncCartFromDB,
    }), [actions, items, itemCount, subtotal, isLoading, syncCartFromDB]);

    return (
        <CartActionsContext.Provider value={actions}>
            <CartContext.Provider value={contextValue}>
                {children}
            </CartContext.Provider>
        </CartActionsContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

/**
 * Just the cart actions. Their identities only change on sign-in/out, so a
 * component that adds to the cart without showing it (e.g. every ProductCard
 * in a grid) is not re-rendered each time the cart changes.
 */
export function useCartActions() {
    const context = useContext(CartActionsContext);
    if (!context) {
        throw new Error('useCartActions must be used within a CartProvider');
    }
    return context;
}
