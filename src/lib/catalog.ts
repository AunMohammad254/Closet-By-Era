import 'server-only';

import { unstable_cache } from 'next/cache';
import { connection } from 'next/server';
import { createStaticClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { Catalog, CatalogProduct } from '@/lib/catalog-filter';

/**
 * Listings for the department, sale and new-arrival pages, read on the server
 * so the products arrive with the HTML. Only public rows are listed, so they are
 * read without the visitor's session and cached like the home page's featured
 * products: 60 seconds, or until a product or category change revalidates the tag.
 */

const LISTING_COLUMNS =
    'id, name, slug, price, original_price, image_url, images, is_new, is_sale, is_featured, created_at, categories(name)';

const CACHE = { revalidate: 60, tags: ['products', 'categories'] };

const EMPTY: Catalog = { categoryNames: [], products: [] };

type ListingRow = {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    original_price: number | null;
    image_url: string | null;
    images: string[] | null;
    is_new: boolean | null;
    is_sale: boolean | null;
    is_featured: boolean | null;
    created_at: string;
    categories: { name: string } | null;
};

function toCatalogProduct(p: ListingRow): CatalogProduct {
    return {
        id: p.id,
        slug: p.slug || '',
        name: p.name,
        price: p.price,
        originalPrice: p.original_price || undefined,
        image: p.image_url || p.images?.[0] || '/products/placeholder.png',
        category: p.categories?.name || 'Uncategorized',
        isNew: p.is_new || false,
        isSale: p.is_sale || false,
        isFeatured: p.is_featured || false,
        createdAt: Date.parse(p.created_at),
    };
}

async function activeCategoryNames(): Promise<string[]> {
    const { data, error } = await createStaticClient()
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('display_order');
    if (error) throw error;
    return [...new Set(data.map(c => c.name))];
}

/**
 * Products for a department page (e.g. "men"): the root category plus all of
 * its sub-categories. There is no gender column, so the category tree is the
 * only way to keep the Men page from listing the Women's catalog.
 */
const loadDepartment = unstable_cache(async (rootSlug: string): Promise<Catalog> => {
    const supabase = createStaticClient();

    const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .eq('is_active', true)
        .order('display_order');

    if (categoriesError) throw categoriesError;

    const root = categories.find(c => c.slug === rootSlug);
    if (!root) return EMPTY;

    const ids = new Set([root.id]);
    for (let grew = true; grew;) {
        grew = false;
        for (const c of categories) {
            if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
                ids.add(c.id);
                grew = true;
            }
        }
    }

    const { data: products, error } = await supabase
        .from('products')
        .select(LISTING_COLUMNS)
        .in('category_id', [...ids])
        .eq('is_active', true)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const categoryNames = [...new Set(
        categories.filter(c => c.id !== root.id && ids.has(c.id)).map(c => c.name)
    )];

    return { categoryNames, products: (products as ListingRow[]).map(toCatalogProduct) };
}, ['catalog-department'], CACHE);

/** Active, in-stock products flagged new, with every active category as a filter. */
const loadNewArrivals = unstable_cache(async (): Promise<Catalog> => {
    const [categoryNames, { data: products, error }] = await Promise.all([
        activeCategoryNames(),
        createStaticClient()
            .from('products')
            .select(LISTING_COLUMNS)
            .eq('is_active', true)
            .eq('in_stock', true)
            .eq('is_new', true)
            .order('created_at', { ascending: false }),
    ]);
    if (error) throw error;
    return { categoryNames, products: (products as ListingRow[]).map(toCatalogProduct) };
}, ['catalog-new-arrivals'], CACHE);

/** Active, in-stock products flagged on sale, with every active category as a filter. */
const loadSale = unstable_cache(async (): Promise<Catalog> => {
    const [categoryNames, { data: products, error }] = await Promise.all([
        activeCategoryNames(),
        createStaticClient()
            .from('products')
            .select(LISTING_COLUMNS)
            .eq('is_active', true)
            .eq('in_stock', true)
            .eq('is_sale', true)
            .order('created_at', { ascending: false }),
    ]);
    if (error) throw error;
    return { categoryNames, products: (products as ListingRow[]).map(toCatalogProduct) };
}, ['catalog-sale'], CACHE);

/**
 * A failed load is logged and shown as an empty listing, as before; it is
 * thrown inside the cached loaders above so the failure itself is not cached.
 */
async function orEmpty(load: () => Promise<Catalog>, action: string): Promise<Catalog> {
    // Listings are read per request (from the cache above), never while `next build`
    // prerenders: the shop renders per request anyway (its layout reads cookies), and
    // the build may not reach the database. Outside the try: this throws to stop prerendering.
    await connection();
    try {
        return await load();
    } catch (error) {
        logger.error('Error loading catalog', error, { action });
        return EMPTY;
    }
}

export const getDepartmentCatalog = (rootSlug: string) =>
    orEmpty(() => loadDepartment(rootSlug), `department:${rootSlug}`);

export const getNewArrivalsCatalog = () => orEmpty(loadNewArrivals, 'new-arrivals');

export const getSaleCatalog = () => orEmpty(loadSale, 'sale');
