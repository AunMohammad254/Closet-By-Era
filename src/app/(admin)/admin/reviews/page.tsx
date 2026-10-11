'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getAllReviews,
    deleteReview,
    bulkDeleteReviews,
    setReviewsApproval,
    type AdminReview,
    type ReviewStatusFilter,
} from '@/actions/reviews';
import { Star, Trash2, Loader2, RefreshCw, ExternalLink, MessageSquare, Check, EyeOff } from 'lucide-react';

const STATUS_TABS: { value: ReviewStatusFilter; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Published' },
    { value: 'all', label: 'All' },
];
import Link from 'next/link';

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [ratingFilter, setRatingFilter] = useState<number | undefined>();
    const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('pending');
    const [selected, setSelected] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const pageSize = 15;

    // Callers set `loading` before this runs; it starts true for the initial load.
    const loadReviews = useCallback(() => getAllReviews(page, pageSize, { rating: ratingFilter, status: statusFilter }).then(result => {
        setReviews(result.reviews);
        setTotal(result.total);
        setSelected([]);
        setLoading(false);
    }), [page, ratingFilter, statusFilter]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const fetchReviews = () => {
        setLoading(true);
        return loadReviews();
    };

    const changeQuery = (nextRating: number | undefined, nextPage: number, nextStatus: ReviewStatusFilter = statusFilter) => {
        if (nextRating !== ratingFilter || nextPage !== page || nextStatus !== statusFilter) setLoading(true);
        setRatingFilter(nextRating);
        setPage(nextPage);
        setStatusFilter(nextStatus);
    };

    const runAction = async (action: () => Promise<{ success: boolean; error?: string }>) => {
        setBusy(true);
        try {
            const result = await action();
            if (!result.success) {
                alert('Error: ' + result.error);
                return;
            }
            await fetchReviews();
        } finally {
            setBusy(false);
        }
    };

    const handleApproval = (ids: string[], approved: boolean) => runAction(() => setReviewsApproval(ids, approved));

    const handleBulkDelete = () => {
        if (!confirm(`Delete ${selected.length} review(s)? This cannot be undone.`)) return;
        return runAction(() => bulkDeleteReviews(selected));
    };

    const toggleSelected = (id: string) =>
        setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    const allSelected = reviews.length > 0 && selected.length === reviews.length;

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

        const result = await deleteReview(id);
        if (result.success) {
            await fetchReviews();
        } else {
            alert('Error: ' + result.error);
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Reviews</h1>
                    <p className="text-slate-400 text-sm mt-1">Moderate customer reviews across all products.</p>
                </div>
                <button
                    onClick={fetchReviews}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-700 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex flex-wrap items-center gap-4">
                <div className="flex gap-2" role="tablist" aria-label="Review status">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            role="tab"
                            aria-selected={statusFilter === tab.value}
                            onClick={() => changeQuery(ratingFilter, 1, tab.value)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === tab.value
                                ? 'bg-slate-100 text-slate-900'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-slate-400">Rating:</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => changeQuery(undefined, 1)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${!ratingFilter
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        All
                    </button>
                    {[5, 4, 3, 2, 1].map((rating) => (
                        <button
                            key={rating}
                            onClick={() => changeQuery(rating, 1)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${ratingFilter === rating
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {rating} <Star className="w-3 h-3 fill-current" />
                        </button>
                    ))}
                </div>
                <span className="text-sm text-slate-500 ml-auto">
                    {total} review{total !== 1 ? 's' : ''} found
                </span>
            </div>

            {selected.length > 0 && (
                <div className="bg-[#1e293b] px-4 py-3 rounded-xl border border-slate-700/50 flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-300">{selected.length} selected</span>
                    <button
                        onClick={() => handleApproval(selected, true)}
                        disabled={busy}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                        <Check className="w-4 h-4 mr-1" /> Approve
                    </button>
                    <button
                        onClick={() => handleApproval(selected, false)}
                        disabled={busy}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50"
                    >
                        <EyeOff className="w-4 h-4 mr-1" /> Hide
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        disabled={busy}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                </div>
            )}

            {/* Reviews Table */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-700/50">
                    <thead className="bg-slate-800/50">
                        <tr>
                            <th className="pl-6 py-4 w-8">
                                <input
                                    type="checkbox"
                                    aria-label="Select all reviews on this page"
                                    checked={allSelected}
                                    onChange={() => setSelected(allSelected ? [] : reviews.map(r => r.id))}
                                    className="rounded border-slate-600 bg-slate-800"
                                />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rating</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Comment</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" />
                                    <p className="text-slate-500 mt-2">Loading reviews...</p>
                                </td>
                            </tr>
                        ) : reviews.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <MessageSquare className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                    <p className="text-slate-500">No reviews found</p>
                                    <p className="text-slate-600 text-sm">Reviews will appear here when customers submit them</p>
                                </td>
                            </tr>
                        ) : (
                            reviews.map((review) => (
                                <tr key={review.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="pl-6 py-4">
                                        <input
                                            type="checkbox"
                                            aria-label="Select review"
                                            checked={selected.includes(review.id)}
                                            onChange={() => toggleSelected(review.id)}
                                            className="rounded border-slate-600 bg-slate-800"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-200 font-medium truncate max-w-[200px]">
                                                {review.product?.name || 'Unknown Product'}
                                            </span>
                                            {review.product?.slug && (
                                                <Link
                                                    href={`/product/${review.product.slug}`}
                                                    target="_blank"
                                                    className="text-slate-500 hover:text-rose-400 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {renderStars(review.rating)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-slate-300 text-sm line-clamp-2 max-w-md">
                                            {review.comment || <span className="text-slate-500 italic">No comment</span>}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {review.is_approved ? (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400">Published</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400">Pending</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {new Date(review.created_at).toLocaleDateString('en-PK', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-4">
                                        <button
                                            onClick={() => handleApproval([review.id], !review.is_approved)}
                                            disabled={busy}
                                            className={`inline-flex items-center text-sm font-medium transition-colors disabled:opacity-50 ${review.is_approved ? 'text-slate-400 hover:text-slate-200' : 'text-emerald-400 hover:text-emerald-300'}`}
                                        >
                                            {review.is_approved ? <EyeOff className="w-4 h-4 mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                                            {review.is_approved ? 'Hide' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="inline-flex items-center text-sm text-rose-400 hover:text-rose-300 font-medium transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-[#1e293b] px-6 py-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Showing page <span className="font-medium text-slate-200">{page}</span> of <span className="font-medium text-slate-200">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => changeQuery(ratingFilter, Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="px-4 py-2 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => changeQuery(ratingFilter, Math.min(totalPages, page + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
