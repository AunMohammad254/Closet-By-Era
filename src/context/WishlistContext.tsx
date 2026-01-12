'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
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

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user } = useAuth();

    // Sync wishlist to database
    const syncWishlistToDB = useCallback(async (wishlistItems: WishlistItem[]) => {
        if (!user) return;

        try {
            // Delete existing wishlist items for this user
            await supabase
                .from('wishlist_items')
                .delete()
                .eq('user_id', user.id);

            // Insert new wishlist items
            if (wishlistItems.length > 0) {
                const dbItems = wishlistItems.map(item => ({
                    user_id: user.id,
                    product_id: item.id,
                    product_name: item.name,
                    product_price: item.price,
                    product_image: item.image,
                    category: item.category,
                }));

                await supabase.from('wishlist_items').insert(dbItems);
            }
        } catch (error) {
            console.error('Error syncing wishlist to database:', error);
        }
    }, [user]);

    // Fetch wishlist from database
    const syncWishlistFromDB = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching wishlist from database:', error);
                return;
            }

            if (data && data.length > 0) {
                const wishlistItems: WishlistItem[] = data.map((item: {
                    id: string;
                    product_id: string;
                    product_name: string;
                    product_price: number;
                    product_image: string;
                    category: string;
                }) => ({
                    id: item.product_id,
                    name: item.product_name,
                    price: item.product_price,
                    image: item.product_image,
                    category: item.category,
                }));
                setItems(wishlistItems);
                // Also save to localStorage as backup
                localStorage.setItem('closet-by-era-wishlist', JSON.stringify(wishlistItems));
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Load from localStorage on mount (for guests and initial load)
    useEffect(() => {
        if (isInitialized) return;

        const saved = localStorage.getItem('closet-by-era-wishlist');
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

    // When user logs in, merge local wishlist with database wishlist
    useEffect(() => {
        if (user && isInitialized) {
            const mergeAndSyncWishlist = async () => {
                setIsLoading(true);
                try {
                    // Fetch existing wishlist from database
                    const { data: dbWishlistData } = await supabase
                        .from('wishlist_items')
                        .select('*')
                        .eq('user_id', user.id);

                    // Get local wishlist
                    const localWishlist = items;

                    // Merge wishlists (local wishlist takes precedence for newer items)
                    const mergedWishlist: WishlistItem[] = [...localWishlist];

                    if (dbWishlistData && dbWishlistData.length > 0) {
                        dbWishlistData.forEach((dbItem: {
                            id: string;
                            product_id: string;
                            product_name: string;
                            product_price: number;
                            product_image: string;
                            category: string;
                        }) => {
                            const existingIndex = mergedWishlist.findIndex(
                                item => item.id === dbItem.product_id
                            );

                            if (existingIndex === -1) {
                                // Add item from database that's not in local wishlist
                                mergedWishlist.push({
                                    id: dbItem.product_id,
                                    name: dbItem.product_name,
                                    price: dbItem.product_price,
                                    image: dbItem.product_image,
                                    category: dbItem.category,
                                });
                            }
                        });
                    }

                    setItems(mergedWishlist);
                    // Sync merged wishlist back to database
                    await syncWishlistToDB(mergedWishlist);
                    localStorage.setItem('closet-by-era-wishlist', JSON.stringify(mergedWishlist));
                } catch (error) {
                    console.error('Error merging wishlists:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            mergeAndSyncWishlist();
        }
    }, [user, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

    // Save wishlist to localStorage on change (and sync to DB if logged in)
    useEffect(() => {
        if (!isInitialized) return;

        localStorage.setItem('closet-by-era-wishlist', JSON.stringify(items));

        // Debounce database sync
        const timeoutId = setTimeout(() => {
            if (user) {
                syncWishlistToDB(items);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [items, user, syncWishlistToDB, isInitialized]);

    const addItem = useCallback((item: WishlistItem) => {
        setItems((prev) => {
            if (prev.find((i) => i.id === item.id)) return prev;
            return [...prev, item];
        });
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const isInWishlist = useCallback((id: string) => items.some((item) => item.id === id), [items]);

    const clearWishlist = useCallback(async () => {
        setItems([]);
        localStorage.removeItem('closet-by-era-wishlist');

        if (user) {
            try {
                await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('user_id', user.id);
            } catch (error) {
                console.error('Error clearing wishlist from database:', error);
            }
        }
    }, [user]);

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
