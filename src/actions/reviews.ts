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
        user_id: r.customer_id || '',
        rating: r.rating,
        comment: r.comment || '',
        created_at: r.created_at || new Date().toISOString(),
        images: r.images || [],
        user: { first_name: 'Verified', last_name: 'User' }
    }));
}
