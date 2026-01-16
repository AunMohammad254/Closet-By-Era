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
    category: string;
    isNew?: boolean;
    isSale?: boolean;
}

// Internal type for Supabase query result with categories join
interface ProductQueryResult {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    original_price: number | null;
    image_url: string | null;
    images: string[] | null;
    is_new: boolean | null;
    is_sale: boolean | null;
    categories: { name: string } | null;
}

/**
 * Internal fetcher for featured products (used by cache wrapper)
 */
async function fetchFeaturedProductsInternal(limit: number): Promise<FeaturedProductData[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                price,
                original_price,
                image_url,
                images,
                is_new,
                is_sale,
                categories (
                    name
                )
            `)
            .eq('in_stock', true)
            .eq('is_featured', true)
            .limit(limit);

        if (error) {
            logger.error('Error fetching featured products', error, { action: 'getFeaturedProducts' });
            return [];
        }

        // Map to clean interface
        return (data as unknown as ProductQueryResult[]).map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug || '',
            price: p.price,
            originalPrice: p.original_price || undefined,
            image: p.image_url || (p.images && p.images[0]) || '/products/placeholder.png',
            category: p.categories?.name || 'Uncategorized',
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
 * Internal fetcher for new arrivals (used by cache wrapper)
 */
async function fetchNewArrivalsInternal(limit: number): Promise<FeaturedProductData[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                price,
                original_price,
                image_url,
                images,
                is_new,
                is_sale,
                categories (
                    name
                )
            `)
            .eq('in_stock', true)
            .eq('is_new', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            logger.error('Error fetching new arrivals', error, { action: 'getNewArrivals' });
            return [];
        }

        return (data as unknown as ProductQueryResult[]).map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug || '',
            price: p.price,
            originalPrice: p.original_price || undefined,
            image: p.image_url || (p.images && p.images[0]) || '/products/placeholder.png',
            category: p.categories?.name || 'Uncategorized',
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
