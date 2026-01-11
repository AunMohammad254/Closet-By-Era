import { supabase } from '@/lib/supabase'; // Using the client-compatible one for now, but server-side execution 
import ProductGrid, { ProductUI } from '@/components/ProductGrid';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shop All Products | Closet By Era',
    description: 'Explore our latest collection of premium fashion, accessories, and trends.',
};

export default async function ProductsPage() {
    // 1. Fetch Categories
    const { data: categoriesData } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('is_active', true)
        .order('display_order');

    const categories = ['All', ...(categoriesData?.map(c => c.name) || [])];

    // 2. Fetch Products
    const { data: productsData, error } = await supabase
        .from('products')
        .select(`
            *,
            categories (
                name
            )
        `)
        .eq('in_stock', true); // Only show in-stock items?

    if (error) {
        console.error('Error fetching products:', error);
        // We can handle error better, but for now rendering empty or partial
    }

    // 3. Transform Data
    const products: ProductUI[] = (productsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price,
        image: p.image_url || (p.images && p.images[0]) || '/products/placeholder.png',
        category: p.categories?.name || 'Uncategorized',
        isNew: p.is_new,
        isSale: p.is_sale,
        createdAt: new Date(p.created_at),
        created_at: p.created_at, // Required by Base Product interface
        slug: p.slug,
        description: p.description,
        category_id: p.category_id,
        in_stock: p.in_stock,
        is_featured: p.is_featured,
        // Add required Product interface fields if ProductUI extends it strictly
        sizes: p.sizes,
        colors: p.colors,
        short_description: p.short_description,
        image_url: p.image_url,
        images: p.images
    }));

    return (
        <main className="min-h-screen bg-white">
            {/* Hero Banner */}
            <section className="pt-32 pb-12 bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">All Products</h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Explore our complete collection of premium fashion essentials
                    </p>
                </div>
            </section>

            {/* Client Grid */}
            <ProductGrid initialProducts={products} categories={categories} />
        </main>
    );
}
