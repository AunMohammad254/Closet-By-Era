'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation Schema
const CategorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    display_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof CategorySchema>;

export async function getCategories() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        logger.error('Error fetching categories', error, { action: 'getCategories' });
        return [];
    }

    return data;
}

export async function createCategory(data: CategoryFormData) {
    const validation = CategorySchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: validation.error.message };
    }

    const supabase = await createClient();
    const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const { error } = await supabase
        .from('categories')
        .insert({
            name: data.name,
            slug,
            description: data.description,
            display_order: data.display_order,
            is_active: data.is_active,
        });

    if (error) {
        logger.error('Error creating category', error, { action: 'createCategory' });
        return { success: false, error: 'Failed to create category' };
    }

    revalidatePath('/admin/categories');
    return { success: true };
}

export async function updateCategory(id: string, data: CategoryFormData) {
    const validation = CategorySchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: validation.error.message };
    }

    const supabase = await createClient();
    const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const { error } = await supabase
        .from('categories')
        .update({
            name: data.name,
            slug,
            description: data.description,
            display_order: data.display_order,
            is_active: data.is_active,
        })
        .eq('id', id);

    if (error) {
        logger.error('Error updating category', error, { action: 'updateCategory', categoryId: id });
        return { success: false, error: 'Failed to update category' };
    }

    revalidatePath('/admin/categories');
    return { success: true };
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) {
        logger.error('Error deleting category', error, { action: 'deleteCategory', categoryId: id });
        return { success: false, error: 'Failed to delete category' };
    }

    revalidatePath('/admin/categories');
    return { success: true };
}
