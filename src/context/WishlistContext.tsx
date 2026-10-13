'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

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
    isLoading: boolean;
    syncWishlistFromDB: () => Promise<void>;
}

const WISHLIST_STORAGE_KEY = 'closet-by-era-wishlist';

/** Identifies the rows a wishlist is stored as (order-independent): equal keys need no write. */
function wishlistKey(items: WishlistItem[]): string {
    return JSON.stringify(
        [...items]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(i => [i.id, i.name, i.price, i.image, i.category])
    );
}

type WishlistRow = {
    product_id: string;
    product_name: string;
    product_price: number;
    product_image: string | null;
    category: string | null;
};

function fromRow(row: WishlistRow): WishlistItem {
    return {
        id: row.product_id,
        name: row.product_name || 'Unknown Product',
        price: row.product_price || 0,
        image: row.product_image || '',
        category: row.category || 'Uncategorized',
    };
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user } = useAuth();
    // Depend on the id, not the User object (see CartContext).
    const userId = user?.id ?? null;

    // The user whose database wishlist has been merged in. Until then the local
    // list is incomplete, and syncing it would delete the account's saved items.
    const mergedUserRef = useRef<string | null>(null);
    // Key of the list the database is known to hold.
    const syncedKeyRef = useRef<string | null>(null);

    // Sync wishlist to database - upsert the list, then drop rows no longer in it
    const syncWishlistToDB = useCallback(async (wishlistItems: WishlistItem[]) => {
        if (!userId) return;
        const key = wishlistKey(wishlistItems);
        if (key === syncedKeyRef.current) return;

        try {
            if (wishlistItems.length === 0) {
                const { error } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('user_id', userId);
                if (error) throw error;
                syncedKeyRef.current = key;
                return;
            }

            // Get current wishlist item IDs from DB
            const { data: existingItems, error: selectError } = await supabase
                .from('wishlist_items')
                .select('id, product_id')
                .eq('user_id', userId);
            if (selectError) throw selectError;

            const dbItems = wishlistItems.map(item => ({
                user_id: userId,
                product_id: item.id,
                product_name: item.name,
                product_price: item.price,
                product_image: item.image,
                category: item.category,
            }));

            // Upsert all items (insert or update on conflict)
            const { error: upsertError } = await supabase
                .from('wishlist_items')
                .upsert(dbItems, {
                    onConflict: 'user_id,product_id',
                    ignoreDuplicates: false
                });
            if (upsertError) throw upsertError;

            // Remove items that are no longer in wishlist
            const currentProductIds = new Set(wishlistItems.map(item => item.id));
            const idsToDelete = (existingItems ?? [])
                .filter(item => !currentProductIds.has(item.product_id))
                .map(item => item.id);

            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .in('id', idsToDelete);
                if (deleteError) throw deleteError;
            }
            syncedKeyRef.current = key;
        } catch (error) {
            console.error('Error syncing wishlist to database:', error);
        }
    }, [userId, supabase]);

    // Fetch wishlist from database
    const syncWishlistFromDB = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('wishlist_items')
                .select('id, product_id, product_name, product_price, product_image, category')
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching wishlist from database:', error);
                return;
            }

            if (data && data.length > 0) {
                const wishlistItems = data.map(fromRow);
                syncedKeyRef.current = wishlistKey(wishlistItems);
                setItems(wishlistItems);
                // Also save to localStorage as backup
                localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, supabase]);

    // Load from localStorage on mount (for guests and initial load)
    useEffect(() => {
        if (isInitialized) return;

        const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (saved) {
            try {
                const parsedWishlist = JSON.parse(saved);
                setItems(parsedWishlist);
            } catch (error) {
                console.error('Error parsing saved wishlist:', error);
            }
        }
        setIsInitialized(true);
    }, [isInitialized]);

    // Forget the previous account's sync state on sign-out
    useEffect(() => {
        if (!userId) {
            mergedUserRef.current = null;
            syncedKeyRef.current = null;
        }
    }, [userId]);

    // When user logs in, merge the database wishlist into the local one (once per sign-in).
    // The items effect below then writes the merged list back only if it differs.
    useEffect(() => {
        if (!userId || !isInitialized || mergedUserRef.current === userId) return;
        let cancelled = false;

        const mergeWishlist = async () => {
            setIsLoading(true);
            try {
                const { data: dbWishlistData, error } = await supabase
                    .from('wishlist_items')
                    .select('id, product_id, product_name, product_price, product_image, category')
                    .eq('user_id', userId);
                if (error) throw error;
                if (cancelled) return;

                const dbWishlist = (dbWishlistData ?? []).map(fromRow);
                syncedKeyRef.current = wishlistKey(dbWishlist);
                mergedUserRef.current = userId;

                // Local items take precedence; add the ones only the database has.
                setItems(prev => {
                    const localIds = new Set(prev.map(item => item.id));
                    return [...prev, ...dbWishlist.filter(item => !localIds.has(item.id))];
                });
            } catch (error) {
                console.error('Error merging wishlists:', error);
            } finally {
                setIsLoading(false);
            }
        };

        mergeWishlist();
        return () => { cancelled = true; };
    }, [userId, isInitialized, supabase]);

    // Save wishlist to localStorage on change (and sync to DB if logged in)
    useEffect(() => {
        if (!isInitialized) return;

        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));

        if (!userId || mergedUserRef.current !== userId) return;
        if (wishlistKey(items) === syncedKeyRef.current) return;

        // Debounce database sync
        const timeoutId = setTimeout(() => {
            syncWishlistToDB(items);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [items, userId, syncWishlistToDB, isInitialized]);

    const addItem = useCallback((item: WishlistItem) => {
        setItems((prev) => {
            if (prev.find((i) => i.id === item.id)) return prev;
            return [...prev, item];
        });
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const wishlistIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
    const isInWishlist = useCallback((id: string) => wishlistIds.has(id), [wishlistIds]);

    const clearWishlist = useCallback(async () => {
        setItems([]);
        localStorage.removeItem(WISHLIST_STORAGE_KEY);

        if (userId) {
            try {
                const { error } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('user_id', userId);
                if (error) throw error;
                syncedKeyRef.current = wishlistKey([]);
            } catch (error) {
                console.error('Error clearing wishlist from database:', error);
            }
        }
    }, [userId, supabase]);

    const itemCount = items.length;

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        items,
        addItem,
        removeItem,
        isInWishlist,
        clearWishlist,
        itemCount,
        isLoading,
        syncWishlistFromDB
    }), [items, addItem, removeItem, isInWishlist, clearWishlist, itemCount, isLoading, syncWishlistFromDB]);

    return (
        <WishlistContext.Provider value={contextValue}>
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
