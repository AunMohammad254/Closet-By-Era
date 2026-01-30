'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
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
        .filter(Boolean);
}

export async function getLowStockProducts(threshold = 5) {
    const supabase = await createClient();
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
        .select(`id, name, slug, price, stock, images, is_active, in_stock, created_at, category:${categoryJoinValues}`, { count: 'exact' });

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
    const supabase = await createClient();
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

// Audit logging is now handled automatically by database trigger (log_product_changes)


export async function createProduct(data: ProductFormData): Promise<{ success: boolean; error?: string }> {
    // Validate input with Zod
    const validation = ProductFormSchema.safeParse(data);
    if (!validation.success) {
        const errorMessage = validation.error.issues.map(e => e.message).join(', ');
        logger.warn('Product validation failed', { action: 'createProduct', errors: errorMessage });
        return { success: false, error: errorMessage };
    }

    const supabase = await createClient();
    const validData = validation.data;
    const slug = validData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
            name: validData.name,
            slug,
            description: validData.description || null,
            price: validData.price,
            stock: validData.stock,
            images: validData.images,
            is_active: validData.is_active,
            in_stock: validData.stock > 0,
        })
        .select()
        .single();

    if (error) {
        logger.error('Error creating product', error, { action: 'createProduct' });
        return { success: false, error: 'Failed to create product' };
    }

    revalidatePath('/admin/products');
    revalidatePath('/dashboard/products');
    revalidateTag('products', 'max'); // Invalidate all product caches
    revalidateTag('featured-products', 'max');
    revalidateTag('new-arrivals', 'max');
    return { success: true };
}

export async function updateProduct(id: string, data: ProductFormData): Promise<{ success: boolean; error?: string }> {
    // Validate input with Zod
    const validation = ProductFormSchema.safeParse(data);
    if (!validation.success) {
        const errorMessage = validation.error.issues.map(e => e.message).join(', ');
        logger.warn('Product validation failed', { action: 'updateProduct', productId: id, errors: errorMessage });
        return { success: false, error: errorMessage };
    }

    const supabase = await createClient();
    const validData = validation.data;
    const { error } = await supabase
        .from('products')
        .update({
            name: validData.name,
            description: validData.description || null,
            price: validData.price,
            stock: validData.stock,
            images: validData.images,
            is_active: validData.is_active,
            in_stock: validData.stock > 0,
        })
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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

    const supabase = await createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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

    const supabase = await createClient();
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
