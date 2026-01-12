'use client';

import { Review } from '@/actions/reviews';
import StarRating from './StarRating';

interface ReviewListProps {
    reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 mb-2">No reviews yet.</p>
                <p className="text-sm text-gray-400">Be the first to share your thoughts!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-medium text-sm">
                                {review.user?.first_name?.[0] || 'U'}{review.user?.last_name?.[0] || ''}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 text-sm">
                                    {review.user?.first_name} {review.user?.last_name}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <StarRating rating={review.rating} size="sm" readonly />
                                    <span className="text-xs text-gray-400">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mt-2">
                        {review.comment}
                    </p>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            {review.images.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100">
                                    <img src={img} alt="Review attachment" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
