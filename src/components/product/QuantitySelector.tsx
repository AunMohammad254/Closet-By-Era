'use client';

interface QuantitySelectorProps {
    quantity: number;
    setQuantity: (q: number) => void;
}

export default function QuantitySelector({ quantity, setQuantity }: QuantitySelectorProps) {
    return (
        <div className="mt-8">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Quantity</span>
            <div className="mt-3 flex items-center w-fit border border-gray-200 dark:border-slate-700 rounded-lg" role="group" aria-label="Quantity">
                <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
                <span className="px-4 py-2 text-gray-900 dark:text-white font-medium" aria-live="polite" data-testid="quantity-value">{quantity}</span>
                <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
