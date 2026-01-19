'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';

export interface FeaturedProductData {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    image: string;
    category?: string;
    isNew?: boolean;
    isSale?: boolean;
}

// RPC result type
interface RpcProductResult {
    id: string;
    name: string;
    slug: string;
    price: number;
    original_price: number | null;
    image: string | null;
    is_new: boolean | null;
    is_sale: boolean | null;
}

/**
 * Internal fetcher for featured products using optimized RPC
 */
async function fetchFeaturedProductsInternal(limit: number): Promise<FeaturedProductData[]> {
    try {
        const supabase = await createClient();
        // Use optimized RPC function for better performance
        // @ts-ignore - RPC function exists in DB but not in types yet
        const { data, error } = await supabase.rpc('get_featured_products_fast', {
            p_limit: limit
        });

        if (error) {
            logger.error('Error fetching featured products via RPC', error, { action: 'getFeaturedProducts' });
            return [];
        }

        // RPC returns JSON array directly
        const products = (data as unknown as RpcProductResult[]) || [];

        return products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug || '',
            price: p.price,
            originalPrice: p.original_price || undefined,
            image: p.image || '/products/placeholder.png',
            isNew: p.is_new || false,
            isSale: p.is_sale || false,
        }));
    } catch (error) {
        logger.error('Unexpected error fetching featured products', error, { action: 'getFeaturedProducts' });
        return [];
    }
}

/**
 * Fetch featured products from database with caching
 * Uses optimized RPC function + Next.js caching for best performance
 * Cache lasts 60 seconds and can be invalidated with 'featured-products' tag
 */
export async function getFeaturedProducts(limit = 8): Promise<FeaturedProductData[]> {
    const getCachedFeaturedProducts = unstable_cache(
        () => fetchFeaturedProductsInternal(limit),
        ['featured-products', `limit-${limit}`],
        {
            revalidate: 60, // 60 seconds
            tags: ['featured-products', 'products']
        }
    );
    return getCachedFeaturedProducts();
}

/**
 * Internal fetcher for new arrivals using optimized RPC
 */
async function fetchNewArrivalsInternal(limit: number): Promise<FeaturedProductData[]> {
    try {
        const supabase = await createClient();
        // Use optimized RPC function for better performance
        // @ts-ignore - RPC function exists in DB but not in types yet
        const { data, error } = await supabase.rpc('get_new_arrivals_fast', {
            p_limit: limit
        });

        if (error) {
            logger.error('Error fetching new arrivals via RPC', error, { action: 'getNewArrivals' });
            return [];
        }

        const products = (data as unknown as RpcProductResult[]) || [];

        return products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug || '',
            price: p.price,
            originalPrice: p.original_price || undefined,
            image: p.image || '/products/placeholder.png',
            isNew: true,
            isSale: p.is_sale || false,
        }));
    } catch (error) {
        logger.error('Unexpected error fetching new arrivals', error, { action: 'getNewArrivals' });
        return [];
    }
}

/**
 * Fetch new arrivals with caching
 * Uses optimized RPC function + Next.js caching for best performance
 * Cache lasts 60 seconds and can be invalidated with 'new-arrivals' tag
 */
export async function getNewArrivals(limit = 4): Promise<FeaturedProductData[]> {
    const getCachedNewArrivals = unstable_cache(
        () => fetchNewArrivalsInternal(limit),
        ['new-arrivals', `limit-${limit}`],
        {
            revalidate: 60,
            tags: ['new-arrivals', 'products']
        }
    );
    return getCachedNewArrivals();
}
