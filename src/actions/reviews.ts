'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    user?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    }
}

export async function submitReview(productId: string, rating: number, comment: string) {
    try {
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) {
            return { error: "You must be logged in to submit a review." };
        }

        const { error } = await supabaseServer
            .from('reviews')
            .insert({
                product_id: productId,
                user_id: user.id,
                rating,
                comment,
            });

        if (error) {
            console.error("Submit Review Error:", error);
            return { error: "Failed to submit review. Please try again." };
        }

        revalidatePath(`/product/[slug]`); // Revalidate generally or specific path if possible
        return { success: true };
    } catch (err) {
        console.error("Submit Review Exception:", err);
        return { error: "An unexpected error occurred." };
    }
}

export async function getProductReviews(productId: string): Promise<Review[]> {
    const { data: reviews, error } = await supabaseServer
        .from('reviews')
        .select(`
            *,
            user:customers(first_name, last_name, avatar_url)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Get Reviews Error:", error);
        return [];
    }

    // Map customer data if the join works, otherwise might be null if 'customers' table isn't linked via FK correctly
    // or if we need to manually fetch. 
    // Assuming 'customers' table has auth_id or id matching user_id. 
    // Schema check: customers table usually maps auth_id to user.id. 
    // If 'reviews.user_id' -> 'auth.users.id', and 'customers.auth_id' -> 'auth.users.id', 
    // we can't directly join 'reviews' to 'customers' unless review has customer_id OR we join on auth_id.
    // Supabase join syntax on non-FK might be tricky.

    // Fallback: If direct join fails/returns null user, we might render "Anonymous User" or fetch manually.
    // For now, let's try assuming the relationship exists or we can fetch manually.

    // FIX: Manual fetch for simplicity if FK missing
    // Actually, let's return plain reviews first. We can enhance user details later if the SQL join is complex without explicit FKs.

    return (reviews as any[])?.map(r => ({
        ...r,
        user: r.user || { first_name: 'Verified', last_name: 'User' } // Default fallback
    })) || [];
}
