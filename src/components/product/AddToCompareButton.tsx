'use client';

import { useCompare } from '@/context/CompareContext';
import { ProductDetails } from '@/components/ProductView';

interface AddToCompareProps {
    product: {
        id: string;
        name: string;
        price: number;
        image: string;
        category: string;
        slug: string;
    };
    iconOnly?: boolean;
    className?: string;
}

export default function AddToCompareButton({ product, iconOnly = true, className = '' }: AddToCompareProps) {
    const { addToCompare, removeFromCompare, isInCompare } = useCompare();
    const isAdded = isInCompare(product.id);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation if inside a card
        e.stopPropagation();

        if (isAdded) {
            removeFromCompare(product.id);
        } else {
            addToCompare({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                slug: product.slug,
            });
        }
    };

    if (iconOnly) {
        return (
            <button
                onClick={handleToggle}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAdded
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-gray-600 hover:text-slate-900 hover:bg-gray-50 border border-gray-100 shadow-sm'
                    } ${className}`}
                title={isAdded ? "Remove from compare" : "Add to compare"}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" />
                </svg>
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isAdded
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${className}`}
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" />
            </svg>
            {isAdded ? 'Added to Compare' : 'Compare'}
        </button>
    );
}
