'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAdminContext, FORBIDDEN } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

import { ActionResult } from '@/types/shared';
import type { Tables } from '@/types/supabase';

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
    images?: string[];
    created_at: string;
    user?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    }
}

// Review photos must come from our own review-images bucket.
const REVIEW_IMAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-images/`;

const ReviewSchema = z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000),
    images: z.array(z.string().url().refine(url => url.startsWith(REVIEW_IMAGE_PREFIX))).max(5),
});

const IdsSchema = z.array(z.string().uuid()).min(1).max(50);

/** New reviews wait for staff approval before they appear on the product page. */
export async function submitReview(productId: string, rating: number, comment: string, images: string[] = []): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "You must be logged in to submit a review." };
        }

        const parsed = ReviewSchema.safeParse({ productId, rating, comment, images });
        if (!parsed.success) {
            return { success: false, error: "Please choose a rating and keep your review under 2000 characters." };
        }

        const rateCheck = await checkRateLimit(user.id, 'submit-review', RateLimits.sensitive);
        if (!rateCheck.allowed) {
            return { success: false, error: `Too many reviews. Please try again in ${rateCheck.resetIn}s` };
        }

        // is_approved is forced to false for customers by a DB trigger.
        const { error } = await supabase
            .from('reviews')
            .insert({
                product_id: parsed.data.productId,
                user_id: user.id,
                rating: parsed.data.rating,
                comment: parsed.data.comment,
                images: parsed.data.images,
            });

        if (error) {
            logger.error('Submit review failed', error, { action: 'submitReview' });
            return { success: false, error: "Failed to submit review. Please try again." };
        }

        revalidatePath('/admin/reviews');
        return { success: true, message: "Thanks! Your review will appear once it has been approved." };
    } catch (err) {
        logger.error('Submit review exception', err, { action: 'submitReview' });
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function getProductReviews(productId: string): Promise<Review[]> {
    const supabase = await createClient();
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Get product reviews failed', error, { productId });
        return [];
    }

    return (reviews ?? []).map((r: Tables<'reviews'>) => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        rating: r.rating,
        comment: r.comment || '',
        created_at: r.created_at,
        images: r.images || [],
        user: { first_name: 'Verified', last_name: 'User' }
    }));
}

// Admin: Get all reviews with product info
export interface AdminReview extends Review {
    is_approved: boolean;
    product?: {
        name: string;
        slug: string;
    };
}

export type ReviewStatusFilter = 'pending' | 'approved' | 'all';

export async function getAllReviews(
    page: number = 1,
    pageSize: number = 20,
    filter?: { rating?: number; status?: ReviewStatusFilter }
): Promise<{ reviews: AdminReview[]; total: number }> {
    const ctx = await getAdminContext();
    if (!ctx) return { reviews: [], total: 0 };

    const size = Math.min(Math.max(pageSize, 1), 100);
    let query = ctx.supabase
        .from('reviews')
        .select('*, products(name, slug)', { count: 'exact' });

    if (filter?.rating) query = query.eq('rating', filter.rating);
    if (filter?.status === 'pending') query = query.eq('is_approved', false);
    if (filter?.status === 'approved') query = query.eq('is_approved', true);

    const { data: reviews, count, error } = await query
        .order('created_at', { ascending: false })
        .range((Math.max(page, 1) - 1) * size, Math.max(page, 1) * size - 1);

    if (error) {
        logger.error('Get all reviews failed', error, { action: 'getAllReviews' });
        return { reviews: [], total: 0 };
    }

    return {
        reviews: (reviews ?? []).map((r) => ({
            id: r.id,
            product_id: r.product_id,
            user_id: r.user_id,
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at,
            images: r.images || [],
            is_approved: r.is_approved,
            product: r.products ? { name: r.products.name, slug: r.products.slug ?? '' } : undefined
        })),
        total: count || 0
    };
}

/** Approve (publish) or unapprove (hide) reviews. */
export async function setReviewsApproval(ids: string[], approved: boolean): Promise<ActionResult<{ updated: number }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const parsed = IdsSchema.safeParse(ids);
    if (!parsed.success) return { success: false, error: 'Select between 1 and 50 reviews' };

    const { data, error } = await ctx.supabase
        .from('reviews')
        .update({ is_approved: approved })
        .in('id', parsed.data)
        .select('id, products(slug)');

    if (error) {
        logger.error('Set review approval failed', error, { action: 'setReviewsApproval' });
        return { success: false, error: 'Failed to update reviews' };
    }

    for (const slug of new Set((data ?? []).map(r => r.products?.slug).filter(Boolean))) {
        revalidatePath(`/product/${slug}`);
    }
    revalidatePath('/admin/reviews');
    return { success: true, data: { updated: data?.length ?? 0 } };
}

// Admin: Delete a review
export async function deleteReview(reviewId: string): Promise<ActionResult> {
    const result = await bulkDeleteReviews([reviewId]);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, message: "Review deleted successfully" };
}

export async function bulkDeleteReviews(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const parsed = IdsSchema.safeParse(ids);
    if (!parsed.success) return { success: false, error: 'Select between 1 and 50 reviews' };

    const { data, error } = await ctx.supabase
        .from('reviews')
        .delete()
        .in('id', parsed.data)
        .select('id');

    if (error) {
        logger.error('Delete reviews failed', error, { action: 'bulkDeleteReviews' });
        return { success: false, error: "Failed to delete reviews" };
    }

    revalidatePath('/admin/reviews');
    return { success: true, data: { deleted: data?.length || 0 } };
}
