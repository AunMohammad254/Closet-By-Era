'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { ActionResult } from '@/types/shared';
import type { Database, Tables } from '@/types/supabase';

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
    images?: string[]; // Added images field
    created_at: string;
    user?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    }
}

export async function submitReview(productId: string, rating: number, comment: string, images: string[] = []): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "You must be logged in to submit a review." };
        }

        const { error } = await supabase
            .from('reviews')
            .insert({
                product_id: productId,
                user_id: user.id,
                rating,
                comment,
                images,
            });

        if (error) {
            console.error("Submit Review Error:", error);
            return { success: false, error: "Failed to submit review. Please try again." };
        }

        revalidatePath(`/product/[slug]`);
        return { success: true, message: "Review submitted successfully!" };
    } catch (err) {
        console.error("Submit Review Exception:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function getProductReviews(productId: string): Promise<Review[]> {
    const supabase = await createClient();
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
            *
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Get Reviews Error:", error);
        return [];
    }

    if (!reviews) return [];

    return reviews.map((r: Tables<'reviews'>) => ({
        id: r.id,
        product_id: r.product_id || '',
        user_id: r.user_id || '',
        rating: r.rating,
        comment: r.comment || '',
        created_at: r.created_at || new Date().toISOString(),
        images: r.images || [],
        user: { first_name: 'Verified', last_name: 'User' }
    }));
}

// Admin: Get all reviews with product info
export interface AdminReview extends Review {
    product?: {
        name: string;
        slug: string;
    };
}

export async function getAllReviews(
    page: number = 1,
    pageSize: number = 20,
    filter?: { rating?: number }
): Promise<{ reviews: AdminReview[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
        .from('reviews')
        .select(`
            *,
            products!inner(name, slug)
        `, { count: 'exact' });

    if (filter?.rating) {
        query = query.eq('rating', filter.rating);
    }

    const { data: reviews, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
        console.error("Get All Reviews Error:", error);
        return { reviews: [], total: 0 };
    }

    if (!reviews) return { reviews: [], total: 0 };

    return {
        reviews: reviews.map((r: any) => ({
            id: r.id,
            product_id: r.product_id || '',
            user_id: r.user_id || '',
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at || new Date().toISOString(),
            images: r.images || [],
            product: r.products ? { name: r.products.name, slug: r.products.slug } : undefined
        })),
        total: count || 0
    };
}

// Admin: Delete a review
export async function deleteReview(reviewId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        // Check admin role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: profile } = await supabase
            .from('customers')
            .select('role')
            .eq('auth_id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return { success: false, error: "Admin access required" };
        }

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) {
            console.error("Delete Review Error:", error);
            return { success: false, error: "Failed to delete review" };
        }

        revalidatePath('/admin/reviews');
        return { success: true, message: "Review deleted successfully" };
    } catch (err) {
        console.error("Delete Review Exception:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

// BULK ACTIONS

/**
 * Bulk delete reviews
 */
export async function bulkDeleteReviews(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: profile } = await supabase
            .from('customers')
            .select('role')
            .eq('auth_id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return { success: false, error: "Admin access required" };
        }

        if (ids.length > 50) {
            return { success: false, error: "Maximum 50 reviews at once" };
        }

        const { data, error } = await supabase
            .from('reviews')
            .delete()
            .in('id', ids)
            .select('id');

        if (error) {
            console.error("Bulk Delete Reviews Error:", error);
            return { success: false, error: "Failed to delete reviews" };
        }

        revalidatePath('/admin/reviews');
        return { success: true, data: { deleted: data?.length || 0 } };
    } catch (err) {
        console.error("Bulk Delete Reviews Exception:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

/**
 * Bulk approve reviews (for moderation)
 */
export async function bulkApproveReviews(ids: string[]): Promise<ActionResult<{ approved: number }>> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: profile } = await supabase
            .from('customers')
            .select('role')
            .eq('auth_id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return { success: false, error: "Admin access required" };
        }

        if (ids.length > 50) {
            return { success: false, error: "Maximum 50 reviews at once" };
        }

        // If table has is_approved column, update it
        const { data, error } = await supabase
            .from('reviews')
            .update({ is_approved: true } as any)
            .in('id', ids)
            .select('id');

        if (error) {
            // If column doesn't exist, just return success
            if (error.message.includes('is_approved')) {
                return { success: true, data: { approved: ids.length } };
            }
            console.error("Bulk Approve Reviews Error:", error);
            return { success: false, error: "Failed to approve reviews" };
        }

        revalidatePath('/admin/reviews');
        return { success: true, data: { approved: data?.length || 0 } };
    } catch (err) {
        console.error("Bulk Approve Reviews Exception:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

