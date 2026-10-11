'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminContext, FORBIDDEN } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { ProductFormSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

// --- Fetching ---

export async function getProductsByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, stock, images, is_active, in_stock')
        .in('id', ids)
        .eq('in_stock', true);

    if (error) {
        logger.error('Error fetching products by ids', error, { action: 'getProductsByIds' });
        return [];
    }

    // Maintain order
    return ids
        .map(id => data.find(p => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

export async function getLowStockProducts(threshold = 5) {
    const ctx = await getAdminContext();
    if (!ctx) return [];
    const { supabase } = ctx;
    const { data, error } = await supabase
        .from('products')
        .select('id, name, stock, slug, price, images')
        .lt('stock', threshold)
        .eq('is_active', true)
        .order('stock', { ascending: true })
        .limit(5);

    if (error) {
        logger.error('Error fetching low stock products', error, { action: 'getLowStockProducts' });
        return [];
    }

    return data;
}

// Update signature to accept options object for better extensibility check
export async function getProducts(
    page = 1,
    pageSize = 10,
    search = '',
    filters: {
        categories?: string[];
        minPrice?: number;
        maxPrice?: number;
        sort?: string;
    } = {}
) {
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // We need to use !inner join to filter products based on category name if categories are selected
    // Otherwise standard left join is fine
    const categoryJoinValues = filters.categories && filters.categories.length > 0
        ? 'categories!inner(name)'
        : 'categories(name)';

    let query = supabase
        .from('products')
        .select(`id, name, slug, price, original_price, stock, images, image_url, is_active, in_stock, is_new, is_sale, is_featured, created_at, category:${categoryJoinValues}`, { count: 'exact' });

    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    // Apply Filters
    if (filters.categories && filters.categories.length > 0) {
        query = query.in('categories.name', filters.categories);
    }

    if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
    }

    // Apply Sorting
    switch (filters.sort) {
        case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
        case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
        case 'newest':
        default:
            query = query.order('created_at', { ascending: false });
            break;
    }

    const { data, error, count } = await query
        .range(from, to);

    if (error) {
        logger.error('Error fetching products', error, { action: 'getProducts', page, search });
        return { data: [], count: 0 };
    }

    return { data, count };
}

export async function getProductById(id: string) {
    const ctx = await getAdminContext();
    if (!ctx) return null;
    const { supabase } = ctx;
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        logger.error('Error fetching product', error, { action: 'getProductById', productId: id });
        return null;
    }

    return data;
}

export async function getCategories() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

    if (error) {
        logger.error('Error fetching categories', error, { action: 'getCategories' });
        return [];
    }

    return data;
}

// --- mutations ---

import type { ProductFormData } from '@/types/database';
import type { TablesUpdate } from '@/types/supabase';
import type { ValidatedProductFormData } from '@/lib/validations';

// Audit logging is now handled automatically by database trigger (log_product_changes)

/** Row values for a validated form. Optional fields the caller left out stay unchanged. */
function productColumns(d: ValidatedProductFormData): TablesUpdate<'products'> {
    const row: TablesUpdate<'products'> = {
        name: d.name,
        description: d.description || null,
        price: d.price,
        stock: d.stock,
        in_stock: d.stock > 0,
        images: d.images,
        // The storefront shows image_url first, so keep it in step with the gallery.
        image_url: d.images[0] ?? null,
        is_active: d.is_active,
    };
    if (d.original_price !== undefined) row.original_price = d.original_price;
    if (d.category_id !== undefined) row.category_id = d.category_id;
    if (d.category !== undefined) row.category = d.category;
    if (d.is_featured !== undefined) row.is_featured = d.is_featured;
    if (d.is_new !== undefined) row.is_new = d.is_new;
    if (d.is_sale !== undefined) row.is_sale = d.is_sale;
    if (d.sizes !== undefined) row.sizes = d.sizes;
    if (d.colors !== undefined) row.colors = d.colors;
    return row;
}

/** A URL slug from the name that no other product uses yet ("silk-dress", "silk-dress-2", ...). */
async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, name: string): Promise<string> {
    const base = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'product';
    const { data } = await supabase.from('products').select('slug').like('slug', `${base}%`);
    const taken = new Set((data ?? []).map(r => r.slug));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}

const UNIQUE_VIOLATION = '23505';

export async function createProduct(data: ProductFormData): Promise<{ success: boolean; error?: string; id?: string }> {
    // Validate input with Zod
    const validation = ProductFormSchema.safeParse(data);
    if (!validation.success) {
        const errorMessage = validation.error.issues.map(e => e.message).join(', ');
        logger.warn('Product validation failed', { action: 'createProduct', errors: errorMessage });
        return { success: false, error: errorMessage };
    }

    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;
    const validData = validation.data;
    const slug = await uniqueSlug(supabase, validData.name);

    const { data: created, error } = await supabase
        .from('products')
        .insert({ ...productColumns(validData), name: validData.name, price: validData.price, slug })
        .select('id')
        .single();

    if (error) {
        logger.error('Error creating product', error, { action: 'createProduct' });
        return {
            success: false,
            error: error.code === UNIQUE_VIOLATION ? 'Another product was just saved with this name. Please try again.' : 'Failed to create product',
        };
    }

    revalidatePath('/admin/products');
    revalidatePath('/dashboard/products');
    revalidateTag('products', 'max'); // Invalidate all product caches
    revalidateTag('featured-products', 'max');
    revalidateTag('new-arrivals', 'max');
    return { success: true, id: created.id };
}

export async function updateProduct(id: string, data: ProductFormData): Promise<{ success: boolean; error?: string }> {
    // Validate input with Zod
    const validation = ProductFormSchema.safeParse(data);
    if (!validation.success) {
        const errorMessage = validation.error.issues.map(e => e.message).join(', ');
        logger.warn('Product validation failed', { action: 'updateProduct', productId: id, errors: errorMessage });
        return { success: false, error: errorMessage };
    }

    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;
    const validData = validation.data;
    const { error } = await supabase
        .from('products')
        .update(productColumns(validData))
        .eq('id', id);

    if (error) {
        logger.error('Error updating product', error, { action: 'updateProduct', productId: id });
        return { success: false, error: 'Failed to update product' };
    }

    revalidatePath('/admin/products');
    revalidatePath('/dashboard/products');
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/dashboard/products/${id}`);
    revalidateTag('products', 'max');
    revalidateTag('featured-products', 'max');
    revalidateTag('new-arrivals', 'max');
    return { success: true };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        logger.error('Error deleting product', error, { action: 'deleteProduct', productId: id });
        return { success: false, error: 'Failed to delete product' };
    }

    revalidatePath('/admin/products');
    revalidateTag('products', 'max');
    revalidateTag('featured-products', 'max');
    revalidateTag('new-arrivals', 'max');
    return { success: true };
}

export async function toggleProductStatus(id: string, inStock: boolean): Promise<{ success: boolean; error?: string }> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;
    const { error } = await supabase
        .from('products')
        .update({ in_stock: inStock })
        .eq('id', id);

    if (error) {
        logger.error('Error toggling product status', error, { action: 'toggleProductStatus', productId: id });
        return { success: false, error: 'Failed to toggle product status' };
    }

    revalidatePath('/admin/products');
    return { success: true };
}

export async function uploadProductImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    const file = formData.get('file') as File;

    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;

    // Only raster images: SVG/HTML in a public bucket is a stored-XSS vector.
    const allowedTypes: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };
    const fileExt = allowedTypes[file.type];
    if (!fileExt) {
        return { success: false, error: 'Only JPEG, PNG, WebP, AVIF or GIF images are allowed' };
    }
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Image must be 5 MB or smaller' };
    }
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

    if (uploadError) {
        logger.error('Error uploading image', uploadError, { action: 'uploadProductImage' });
        return { success: false, error: 'Failed to upload image' };
    }

    const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
}

export async function bulkDeleteProducts(ids: string[]): Promise<{ success: boolean; error?: string }> {
    if (!ids || ids.length === 0) return { success: true };

    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };
    const { supabase } = ctx;
    const { error } = await supabase
        .from('products')
        .delete()
        .in('id', ids);

    if (error) {
        logger.error('Error batch deleting products', error, { action: 'bulkDeleteProducts', ids });
        return { success: false, error: 'Failed to delete selected products' };
    }

    revalidatePath('/admin/products');
    revalidateTag('products', 'max');
    revalidateTag('featured-products', 'max');
    revalidateTag('new-arrivals', 'max');
    return { success: true };
}

/**
 * Bulk update product active status
 */
export async function bulkUpdateProductStatus(
    ids: string[],
    isActive: boolean
): Promise<{ success: boolean; updated: number; error?: string }> {
    if (!ids || ids.length === 0) return { success: true, updated: 0 };
    if (ids.length > 100) return { success: false, updated: 0, error: 'Maximum 100 products at once' };

    const ctx = await getAdminContext();
    if (!ctx) return { success: false, updated: 0, error: FORBIDDEN };
    const { supabase } = ctx;
    const { data, error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .in('id', ids)
        .select('id');

    if (error) {
        logger.error('Error bulk updating product status', error, { action: 'bulkUpdateProductStatus' });
        return { success: false, updated: 0, error: 'Failed to update products' };
    }

    revalidatePath('/admin/products');
    revalidateTag('products', 'max');
    return { success: true, updated: data?.length || 0 };
}

/**
 * Bulk update product category
 */
export async function bulkUpdateProductCategory(
    ids: string[],
    categoryId: string
): Promise<{ success: boolean; updated: number; error?: string }> {
    if (!ids || ids.length === 0) return { success: true, updated: 0 };
    if (ids.length > 100) return { success: false, updated: 0, error: 'Maximum 100 products at once' };

    const ctx = await getAdminContext();
    if (!ctx) return { success: false, updated: 0, error: FORBIDDEN };
    const { supabase } = ctx;
    const { data, error } = await supabase
        .from('products')
        .update({ category_id: categoryId })
        .in('id', ids)
        .select('id');

    if (error) {
        logger.error('Error bulk updating product category', error, { action: 'bulkUpdateProductCategory' });
        return { success: false, updated: 0, error: 'Failed to update products' };
    }

    revalidatePath('/admin/products');
    revalidateTag('products', 'max');
    return { success: true, updated: data?.length || 0 };
}

/**
 * Bulk adjust product prices by percentage
 */
export async function bulkAdjustPrices(
    ids: string[],
    percentageChange: number
): Promise<{ success: boolean; updated: number; error?: string }> {
    if (!ids || ids.length === 0) return { success: true, updated: 0 };
    if (ids.length > 100) return { success: false, updated: 0, error: 'Maximum 100 products at once' };
    if (percentageChange < -90 || percentageChange > 500) {
        return { success: false, updated: 0, error: 'Price change must be between -90% and +500%' };
    }

    const ctx = await getAdminContext();
    if (!ctx) return { success: false, updated: 0, error: FORBIDDEN };
    const { supabase } = ctx;

    // Fetch current products
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, price')
        .in('id', ids);

    if (fetchError || !products) {
        return { success: false, updated: 0, error: 'Failed to fetch products' };
    }

    // Update each product with new price
    const multiplier = 1 + (percentageChange / 100);
    let updated = 0;

    for (const product of products) {
        const newPrice = Math.round(product.price * multiplier);
        const { error } = await supabase
            .from('products')
            .update({ price: newPrice })
            .eq('id', product.id);

        if (!error) updated++;
    }

    revalidatePath('/admin/products');
    revalidateTag('products', 'max');
    return { success: true, updated };
}

