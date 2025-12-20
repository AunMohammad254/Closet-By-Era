'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Product, ProductFormData, ActionResponse } from '@/types/database';

// ============================================================================
// Get all products
// ============================================================================

export async function getProducts(): Promise<ActionResponse<Product[]>> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data as Product[] };
    } catch (err) {
        return { success: false, error: 'Failed to fetch products' };
    }
}

// ============================================================================
// Get single product by ID
// ============================================================================

export async function getProductById(id: string): Promise<ActionResponse<Product>> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data as Product };
    } catch (err) {
        return { success: false, error: 'Failed to fetch product' };
    }
}

// ============================================================================
// Create product
// ============================================================================

export async function createProduct(formData: ProductFormData): Promise<ActionResponse<Product>> {
    try {
        // Validation
        if (!formData.name || formData.name.trim() === '') {
            return { success: false, error: 'Product name is required' };
        }

        if (formData.price < 0) {
            return { success: false, error: 'Price cannot be negative' };
        }

        if (formData.stock < 0) {
            return { success: false, error: 'Stock cannot be negative' };
        }

        if (!formData.category || formData.category.trim() === '') {
            return { success: false, error: 'Category is required' };
        }

        const { data, error } = await supabase
            .from('products')
            .insert({
                name: formData.name.trim(),
                description: formData.description?.trim() || null,
                price: formData.price,
                stock: formData.stock,
                category: formData.category,
                images: formData.images || [],
                is_active: formData.is_active ?? true,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/products');
        return { success: true, data: data as Product };
    } catch (err) {
        return { success: false, error: 'Failed to create product' };
    }
}

// ============================================================================
// Update product
// ============================================================================

export async function updateProduct(
    id: string,
    formData: Partial<ProductFormData>
): Promise<ActionResponse<Product>> {
    try {
        // Validation
        if (formData.price !== undefined && formData.price < 0) {
            return { success: false, error: 'Price cannot be negative' };
        }

        if (formData.stock !== undefined && formData.stock < 0) {
            return { success: false, error: 'Stock cannot be negative' };
        }

        const updateData: Record<string, unknown> = {};

        if (formData.name !== undefined) updateData.name = formData.name.trim();
        if (formData.description !== undefined) updateData.description = formData.description?.trim() || null;
        if (formData.price !== undefined) updateData.price = formData.price;
        if (formData.stock !== undefined) updateData.stock = formData.stock;
        if (formData.category !== undefined) updateData.category = formData.category;
        if (formData.images !== undefined) updateData.images = formData.images;
        if (formData.is_active !== undefined) updateData.is_active = formData.is_active;

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/products');
        revalidatePath(`/dashboard/products/${id}`);
        return { success: true, data: data as Product };
    } catch (err) {
        return { success: false, error: 'Failed to update product' };
    }
}

// ============================================================================
// Delete product
// ============================================================================

export async function deleteProduct(id: string): Promise<ActionResponse<void>> {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/products');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: 'Failed to delete product' };
    }
}

// ============================================================================
// Toggle product active status
// ============================================================================

export async function toggleProductStatus(id: string, isActive: boolean): Promise<ActionResponse<void>> {
    try {
        const { error } = await supabase
            .from('products')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/products');
        return { success: true, data: undefined };
    } catch (err) {
        return { success: false, error: 'Failed to update product status' };
    }
}

// ============================================================================
// Upload image to Supabase Storage
// ============================================================================

export async function uploadProductImage(
    formData: FormData
): Promise<ActionResponse<string>> {
    try {
        const file = formData.get('file') as File;

        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return { success: true, data: publicUrl };
    } catch (err) {
        return { success: false, error: 'Failed to upload image' };
    }
}
