'use client';

interface SizeSelectorProps {
    sizes: string[];
    selectedSize: string;
    onSelect: (size: string) => void;
    onSizeGuideClick: () => void;
}

export default function SizeSelector({ sizes, selectedSize, onSelect, onSizeGuideClick }: SizeSelectorProps) {
    if (sizes.length === 0) return null;

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Size</span>
                <button
                    onClick={onSizeGuideClick}
                    className="text-sm text-gray-500 underline hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    Size Guide
                </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => (
                    <button
                        key={size}
                        onClick={() => onSelect(size)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${selectedSize === size
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>
    );
}
