'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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
 * Fetch featured products from database
 * Uses server-side Supabase client for better performance
 */
export async function getFeaturedProducts(limit = 8): Promise<FeaturedProductData[]> {
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
 * Fetch new arrivals (products marked as new or recently added)
 */
export async function getNewArrivals(limit = 4): Promise<FeaturedProductData[]> {
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
