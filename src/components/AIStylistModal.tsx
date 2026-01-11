'use client';

import { useState } from 'react';
import { getStylistRecommendations, StylistRecommendation } from '@/actions/stylist';
import Image from 'next/image';
import Link from 'next/link';

interface AIStylistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AIStylistModal({ isOpen, onClose }: AIStylistModalProps) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<StylistRecommendation | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setLoading(true);
        try {
            const data = await getStylistRecommendations(prompt);
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <span className="text-2xl">✨</span>
                        </div>
                        <h2 className="text-2xl font-bold">Style By Era</h2>
                    </div>
                    <p className="text-indigo-100">Tell us the occasion, and we'll curate the perfect look for you.</p>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {!result ? (
                        <div className="space-y-6">
                            <form onSubmit={handleSubmit} className="relative">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., I need an outfit for my best friend's wedding..."
                                    className="w-full pl-5 pr-14 py-4 rounded-xl border border-gray-200 shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none text-lg transition-all"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !prompt.trim()}
                                    className="absolute right-3 top-3 p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </button>
                            </form>

                            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                                <span>Try asking:</span>
                                <button onClick={() => setPrompt("Wedding guest outfit")} className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">Wedding guest</button>
                                <button onClick={() => setPrompt("Professional office attire")} className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">Office Wear</button>
                                <button onClick={() => setPrompt("Summer casuals")} className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">Summer Casuals</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in-up">
                            {/* Message Bubble */}
                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    ✨
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none text-gray-800">
                                    <p>{result.message}</p>
                                </div>
                            </div>

                            {/* Results Grid */}
                            {result.products.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {result.products.map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/product/${product.slug}`}
                                            onClick={onClose}
                                            className="group block bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all"
                                        >
                                            <div className="relative aspect-[3/4]">
                                                {product.image_url ? (
                                                    <Image
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                                                <p className="text-violet-600 font-semibold text-sm mt-1">PKR {product.price.toLocaleString()}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No specific products found, but we're constantly updating our collection!</p>
                                    <button onClick={() => setResult(null)} className="mt-4 text-violet-600 hover:underline">Try another search</button>
                                </div>
                            )}

                            {result.products.length > 0 && (
                                <button
                                    onClick={() => setResult(null)}
                                    className="w-full py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Ask something else
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
