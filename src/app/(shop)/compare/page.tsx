'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { useCompare } from '@/context/CompareContext';
import { getCompareProducts } from '@/actions/products';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { canOptimizeImage, isDisplayableImage } from '@/lib/imageUtils';

type CompareProduct = Awaited<ReturnType<typeof getCompareProducts>>[number];

const imageOf = (p: CompareProduct) => p.image_url || p.images?.[0] || '';
const categoryOf = (p: CompareProduct) => (Array.isArray(p.category) ? p.category[0]?.name : p.category?.name) ?? '—';
const describe = (p: CompareProduct) => {
    const text = p.short_description || p.description || '';
    return text.length > 120 ? `${text.slice(0, 120)}…` : text || '—';
};

function Chips({ values }: { values: string[] | null }) {
    if (!values?.length) return <>—</>;
    return (
        <div className="flex flex-wrap gap-1">
            {values.map(v => (
                <span key={v} className="px-2 py-1 bg-muted rounded text-xs text-foreground">{v}</span>
            ))}
        </div>
    );
}

export default function ComparePage() {
    const { items, removeFromCompare } = useCompare();
    const [products, setProducts] = useState<CompareProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState<string | null>(null);
    const { addItem } = useCart();
    const { formatPrice } = useCurrency();

    useEffect(() => {
        let cancelled = false;
        const fetchDetails = async () => {
            try {
                const data = items.length ? await getCompareProducts(items.map(i => i.id)) : [];
                if (!cancelled) setProducts(data);
            } catch (error) {
                console.error('Error fetching compare products:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchDetails();
        return () => { cancelled = true; };
    }, [items]);

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-16 flex justify-center bg-background" role="status" aria-label="Loading">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="min-h-screen pt-32 pb-16 px-4 bg-background">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-4">Compare Products</h1>
                    <p className="text-muted-foreground mb-8">You haven&apos;t selected any products to compare.</p>
                    <Link href="/products" className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    const handleAddToCart = (product: CompareProduct) => {
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: imageOf(product),
            quantity: 1,
            size: product.sizes?.[0] || '',
            color: product.colors?.[0] || '',
        });
        setAdded(product.name);
        setTimeout(() => setAdded(null), 2500);
    };

    const rows: { label: string; cell: (p: CompareProduct) => React.ReactNode }[] = [
        { label: 'Category', cell: categoryOf },
        {
            label: 'Availability', cell: p => (p.in_stock && p.stock > 0
                ? <span className="text-emerald-600 font-medium">In Stock</span>
                : <span className="text-destructive font-medium">Out of Stock</span>),
        },
        { label: 'Sizes', cell: p => <Chips values={p.sizes} /> },
        { label: 'Colors', cell: p => <Chips values={p.colors} /> },
        { label: 'Description', cell: describe },
    ];

    return (
        <div className="min-h-screen pt-32 pb-16 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-foreground mb-8">Compare Products</h1>

                {added && (
                    <p role="status" className="mb-6 text-sm text-emerald-600">{added} added to cart.</p>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-200 border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 text-left w-48 bg-muted/50 border border-border text-foreground">Feature</th>
                                {products.map(product => {
                                    const image = imageOf(product);
                                    const inStock = product.in_stock && product.stock > 0;
                                    return (
                                        <th key={product.id} className="p-4 text-left w-64 border border-border align-top relative group">
                                            <button
                                                type="button"
                                                onClick={() => removeFromCompare(product.id)}
                                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1 z-10"
                                                aria-label={`Remove ${product.name} from compare`}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            <div className="relative aspect-3/4 bg-muted rounded-lg overflow-hidden mb-4">
                                                {isDisplayableImage(image) && (
                                                    <Image
                                                        src={image}
                                                        alt={product.name}
                                                        fill
                                                        sizes="256px"
                                                        className="object-cover"
                                                        unoptimized={!canOptimizeImage(image)}
                                                    />
                                                )}
                                            </div>
                                            <Link href={`/product/${product.slug ?? product.id}`} className="text-lg font-bold text-foreground hover:text-primary block mb-2">
                                                {product.name}
                                            </Link>
                                            <p className="text-xl font-medium text-foreground mb-4">
                                                {formatPrice(product.price)}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleAddToCart(product)}
                                                disabled={!inStock}
                                                aria-label={`Add ${product.name} to cart`}
                                                className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {inStock ? 'Add to Cart' : 'Out of stock'}
                                            </button>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.map(row => (
                                <tr key={row.label}>
                                    <th scope="row" className="p-4 text-left font-medium text-foreground bg-muted/50 border border-border">{row.label}</th>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-muted-foreground border border-border text-sm">
                                            {row.cell(product)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
