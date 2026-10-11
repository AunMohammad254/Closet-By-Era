'use client';

import { useCurrency } from '@/context/CurrencyContext';
import AddToCompareButton from './AddToCompareButton';

interface ProductActionsProps {
    price: number;
    quantity: number;
    onAddToCart: () => void;
    product: {
        id: string;
        name: string;
        price: number;
        image: string;
        category: string;
        slug: string;
    };
}

export default function ProductActions({ price, quantity, onAddToCart, product }: ProductActionsProps) {
    const { formatPrice } = useCurrency();

    return (
        <div className="mt-8 flex gap-4">
            <button
                onClick={onAddToCart}
                className="flex-1 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-200 transition-colors"
            >
                Add to Cart — {formatPrice(price * quantity)}
            </button>
            <AddToCompareButton
                product={product}
                iconOnly={true}
                className="w-14 h-14 !rounded-full !bg-white dark:!bg-slate-800 !text-gray-600 dark:!text-gray-300 !border !border-gray-200 dark:!border-slate-700 hover:!bg-gray-50 dark:hover:!bg-slate-700 flex-shrink-0"
            />
        </div>
    );
}
