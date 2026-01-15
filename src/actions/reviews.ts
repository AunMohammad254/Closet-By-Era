'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

export async function submitReview(productId: string, rating: number, comment: string, images: string[] = []) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "You must be logged in to submit a review." };
        }

        const { error } = await supabase
            .from('reviews')
            .insert({
                product_id: productId,
                user_id: user.id,
                rating,
                comment,
                images, // Save images
            });

        if (error) {
            console.error("Submit Review Error:", error);
            return { error: "Failed to submit review. Please try again." };
        }

        revalidatePath(`/product/[slug]`);
        return { success: true };
    } catch (err) {
        console.error("Submit Review Exception:", err);
        return { error: "An unexpected error occurred." };
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

    return (reviews as any[])?.map(r => ({
        ...r,
        images: r.images || [], // Ensure images array exists
        user: r.user || { first_name: 'Verified', last_name: 'User' }
    })) || [];
}
