'use client';

export interface ProductColor {
    name: string;
    hex: string;
}

interface ColorSelectorProps {
    colors: ProductColor[];
    selectedColor: ProductColor;
    onSelect: (color: ProductColor) => void;
}

export default function ColorSelector({ colors, selectedColor, onSelect }: ColorSelectorProps) {
    if (colors.length === 0) return null;

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Color: {selectedColor.name}</span>
            </div>
            <div className="mt-3 flex gap-3">
                {colors.map((color) => (
                    <button
                        key={color.name}
                        onClick={() => onSelect(color)}
                        className={`w-10 h-10 rounded-full transition-all ${selectedColor.name === color.name ? 'ring-2 ring-offset-2 ring-slate-900' : ''
                            }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                    />
                ))}
            </div>
        </div>
    );
}
