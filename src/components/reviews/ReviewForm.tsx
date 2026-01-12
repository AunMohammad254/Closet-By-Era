'use client';

import { useState } from 'react';
import { submitReview } from '@/actions/reviews';
import { supabase } from '@/lib/supabase';

export default function ReviewForm({ productId }: { productId: string }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Validation: Max 3 images, Max 5MB each
            if (files.length + images.length > 3) {
                alert('You can only upload up to 3 images.');
                return;
            }

            const validFiles = files.filter(file => {
                if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (max 5MB).`);
                    return false;
                }
                return true;
            });

            setImages(prev => [...prev, ...validFiles]);

            // Generate previews
            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            // Revoke URL to prevent memory leaks
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);
        setUploading(true);

        try {
            if (rating === 0) {
                setMessage({ type: 'error', text: 'Please select a rating' });
                setIsSubmitting(false);
                setUploading(false);
                return;
            }

            // Upload images first
            const uploadedUrls: string[] = [];
            for (const file of images) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('review-images')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw new Error('Failed to upload image');
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('review-images')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            }

            const result = await submitReview(productId, rating, comment, uploadedUrls);

            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: 'Review submitted successfully!' });
                setRating(0);
                setComment('');
                setImages([]);
                setPreviewUrls([]);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setIsSubmitting(false);
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating Stars */}
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                        ★
                    </button>
                ))}
            </div>

            {/* Comment */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                    placeholder="Tell us what you liked about this product..."
                    required
                />
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
                <div className="flex gap-4 flex-wrap">
                    {previewUrls.map((url, index) => (
                        <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                            <img src={url} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    {images.length < 3 && (
                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-rose-500 text-gray-400 hover:text-rose-500 transition-colors">
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-xs">Add</span>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" multiple />
                        </label>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Max 3 images, 5MB each.</p>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || uploading}
                className="w-full py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {uploading ? 'Uploading...' : isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </form>
    );
}
