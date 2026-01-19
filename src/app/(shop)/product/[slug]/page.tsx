import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductView, { ProductDetails } from '@/components/ProductView';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import { RelatedProduct } from '@/components/product/RelatedProducts';

// Helper to map colors
const getColorHex = (name: string) => {
    const colors: Record<string, string> = {
        'Black': '#1a1a1a',
        'White': '#ffffff',
        'Navy': '#1e3a5f',
        'Camel': '#c19a6b',
        'Beige': '#f5f5dc',
        'Grey': '#808080',
        'Brown': '#8b4513',
        'Blue': '#0000ff',
        'Red': '#ff0000',
        'Green': '#008000',
    };
    return colors[name] || '#cccccc';
};

async function getProduct(slug: string) {
    const supabase = await createClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let query = supabase
        .from('products')
        .select(`
            *,
            category:categories(name, slug)
        `);

    if (isUuid) {
        query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
        query = query.eq('slug', slug);
    }

    const { data, error } = await query.single();

    if (error) {
        // Only log actual errors, not "not found" (PGRST116)
        if (error.code !== 'PGRST116') {
            console.error(`Error fetching product with join (slug: ${slug}):`, JSON.stringify(error, null, 2));
        }

        // Fallback: Fetch product without join (supabase already initialized above)
        let fallbackQuery = supabase
            .from('products')
            .select('*');

        if (isUuid) {
            fallbackQuery = fallbackQuery.or(`slug.eq.${slug},id.eq.${slug}`);
        } else {
            fallbackQuery = fallbackQuery.eq('slug', slug);
        }

        const { data: productData, error: productError } = await fallbackQuery.single();

        if (productError || !productData) {
            if (productError?.code !== 'PGRST116') {
                console.error(`Fallback fetch failed for slug: ${slug}`, JSON.stringify(productError, null, 2));
            }
            return null;
        }

        // Fetch category separately if needed
        let categoryData = null;
        if (productData.category_id) {
            const { data: cat } = await supabase
                .from('categories')
                .select('name, slug')
                .eq('id', productData.category_id)
                .single();
            categoryData = cat;
        }

        // Construct result manually
        return mapDBToProduct(productData, categoryData);
    }

    if (!data) return null;
    return mapDBToProduct(data, data.category);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDBToProduct(data: Omit<Tables<'products'>, 'category'> & { category?: any }, categoryData: { name: string; slug: string } | null): ProductDetails {
    return {
        id: data.id,
        name: data.name,
        price: data.price,
        originalPrice: data.original_price ?? undefined,
        description: data.description || '',
        shortDescription: data.short_description ?? undefined,
        category: categoryData?.name || 'Uncategorized',
        categorySlug: categoryData?.slug || 'all',
        images: data.images || (data.image_url ? [data.image_url] : ['/products/placeholder.png']),
        sizes: data.sizes || [],
        colors: (data.colors || []).map((c: string) => ({ name: c, hex: getColorHex(c) })),
        inStock: data.in_stock ?? false,
        isNew: data.is_new ?? false,
        isSale: data.is_sale ?? false,
        features: [],
        sku: data.id.substring(0, 8).toUpperCase(),
    };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        return {
            title: 'Product Not Found | Closet By Era',
        };
    }

    return {
        title: `${product.name} | Closet By Era`,
        description: product.description,
        openGraph: {
            title: product.name,
            description: product.description,
            images: product.images,
        },
    };
}

import { getProductReviews } from '@/actions/reviews';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        notFound();
    }

    const supabase = await createClient();

    // Parallel fetching for performance
    const [relatedDataSimple, reviews] = await Promise.all([
        supabase
            .from('products')
            .select('*')
            .neq('id', product.id)
            .limit(4),
        getProductReviews(product.id)
    ]);

    const relatedProducts: RelatedProduct[] = (relatedDataSimple.data || []).map((p: Tables<'products'>) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price ?? undefined,
        image: p.image_url || (p.images && p.images[0]) || '',
        category: 'View Details', // Placeholder
        isNew: p.is_new ?? false,
        isSale: p.is_sale ?? false,
    }));

    return (
        <>
            <AnalyticsTracker productId={product.id} productName={product.name} />
            <ProductView product={product} relatedProducts={relatedProducts} reviews={reviews} />
        </>
    );
}

