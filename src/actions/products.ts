'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- Fetching ---

export async function getProductsByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];

    const { data, error } = await supabaseServer
        .from('products')
        .select('id, name, slug, price, stock, images, is_active, in_stock')
        .in('id', ids)
        .eq('in_stock', true);

    if (error) {
        console.error('Error fetching products by ids:', error);
        return [];
    }

    // Maintain order
    return ids
        .map(id => data.find(p => p.id === id))
        .filter(Boolean);
}

export async function getLowStockProducts(threshold = 5) {
    const { data, error } = await supabaseServer
        .from('products')
        .select('id, name, stock, slug, price, images')
        .lt('stock', threshold)
        .eq('is_active', true)
        .order('stock', { ascending: true })
        .limit(5);

    if (error) {
        console.error('Error fetching low stock products:', error);
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
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // We need to use !inner join to filter products based on category name if categories are selected
    // Otherwise standard left join is fine
    const categoryJoinValues = filters.categories && filters.categories.length > 0
        ? 'categories!inner(name)'
        : 'categories(name)';

    let query = supabaseServer
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
        console.error('Error fetching products:', error);
        return { data: [], count: 0 };
    }

    return { data, count };
}

export async function getProductById(id: string) {
    const { data, error } = await supabaseServer
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }

    return data;
}

export async function getCategories() {
    const { data, error } = await supabaseServer
        .from('categories')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data;
}

// --- mutations ---

import type { ProductFormData } from '@/types/database';

// Audit logging is now handled automatically by database trigger (log_product_changes)


export async function createProduct(data: ProductFormData): Promise<{ success: boolean; error?: string }> {
    const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const { data: newProduct, error } = await supabaseServer
        .from('products')
        .insert({
            name: data.name,
            slug,
            description: data.description,
            price: data.price,
            stock: data.stock,
            images: data.images,
            is_active: data.is_active,
            in_stock: data.stock > 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating product:', error);
        return { success: false, error: 'Failed to create product' };
    }

    revalidatePath('/admin/products');
    revalidatePath('/dashboard/products');
    return { success: true };
}

export async function updateProduct(id: string, data: ProductFormData): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseServer
        .from('products')
        .update({
            name: data.name,
            description: data.description,
            price: data.price,
            stock: data.stock,
            images: data.images,
            is_active: data.is_active,
            in_stock: data.stock > 0,
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating product:', error);
        return { success: false, error: 'Failed to update product' };
    }

    revalidatePath('/admin/products');
    revalidatePath('/dashboard/products');
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/dashboard/products/${id}`);
    return { success: true };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseServer
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: 'Failed to delete product' };
    }

    revalidatePath('/admin/products');
    return { success: true };
}

export async function toggleProductStatus(id: string, inStock: boolean): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseServer
        .from('products')
        .update({ in_stock: inStock })
        .eq('id', id);

    if (error) {
        console.error('Error toggling product status:', error);
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

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabaseServer.storage
        .from('product-images')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return { success: false, error: 'Failed to upload image' };
    }

    const { data: { publicUrl } } = supabaseServer.storage
        .from('product-images')
        .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
}


