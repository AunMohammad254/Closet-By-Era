'use client';

import { Review } from '@/actions/reviews';
import Image from 'next/image';
import StarRating from './StarRating';

interface ReviewListProps {
    reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                <p className="text-gray-500 dark:text-gray-400 mb-2">No reviews yet.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to share your thoughts!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 dark:border-slate-800 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                                {review.user?.first_name?.[0] || 'U'}{review.user?.last_name?.[0] || ''}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {review.user?.first_name} {review.user?.last_name}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <StarRating rating={review.rating} size="sm" readonly />
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-2">
                        {review.comment}
                    </p>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {review.images.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800">
                                    <Image 
                                      src={img} 
                                      alt="Review attachment" 
                                      fill
                                      className="object-cover"
                                      sizes="64px"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
