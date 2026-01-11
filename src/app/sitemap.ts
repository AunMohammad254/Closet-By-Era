import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://closetbyera.com';

    // Static routes
    const routes = [
        '',
        '/products',
        '/women',
        '/men',
        '/accessories',
        '/sale',
        '/auth/login',
        '/auth/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes - Products
    let productRoutes: MetadataRoute.Sitemap = [];
    try {
        const { data: products } = await supabase
            .from('products')
            .select('slug, updated_at')
            .eq('in_stock', true); // Only index in-stock products?

        if (products) {
            productRoutes = products.map((product) => ({
                url: `${baseUrl}/product/${product.slug}`,
                lastModified: new Date(product.updated_at || new Date()),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }));
        }
    } catch (error) {
        console.error('Error fetching products for sitemap:', error);
    }

    return [...routes, ...productRoutes];
}
