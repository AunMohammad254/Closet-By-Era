'use client';

import Link from 'next/link';

interface AddToCartToastProps {
    isVisible: boolean;
}

export default function AddToCartToast({ isVisible }: AddToCartToastProps) {
    return (
        <div
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
        >
            <div className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-full shadow-xl">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Added to cart!
                <Link href="/cart" className="ml-2 text-rose-400 hover:text-rose-300 transition-colors">
                    View Cart
                </Link>
            </div>
        </div>
    );
}
