import { supabase } from '@/lib/supabase';
import ProductGrid, { ProductUI } from '@/components/ProductGrid';
import ProductFilters from '@/components/shop/ProductFilters';
import { getProducts } from '@/actions/products';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shop All Products | Closet By Era',
    description: 'Explore our latest collection of premium fashion, accessories, and trends.',
};

// Type for products returned from getProducts action
interface ProductsQueryResult {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    stock: number;
    images: string[] | null;
    is_active: boolean;
    in_stock: boolean | null;
    created_at: string;
    category: { name: string } | null;
    original_price?: number | null;
    image_url?: string | null;
    is_new?: boolean | null;
    is_sale?: boolean | null;
    is_featured?: boolean | null;
    description?: string | null;
    short_description?: string | null;
    category_id?: string | null;
    sizes?: string[] | null;
    colors?: string[] | null;
}

interface ProductsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    // Await searchParams (Next.js 16 requirement)
    const params = await searchParams;

    // 1. Fetch Categories
    const { data: categoriesData } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('is_active', true)
        .order('display_order');

    const categories = [...(categoriesData?.map((c: { name: string; slug: string }) => c.name) || [])];

    // 2. Parse Filters from URL
    const selectedCategories = typeof params.categories === 'string' ? params.categories.split(',') : [];
    const minPrice = typeof params.minPrice === 'string' ? parseInt(params.minPrice) : undefined;
    const maxPrice = typeof params.maxPrice === 'string' ? parseInt(params.maxPrice) : undefined;
    const sort = typeof params.sort === 'string' ? params.sort : 'newest';
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;

    // 3. Fetch Products with Filters via Action
    const { data: productsData } = await getProducts(page, 100, '', { // Fetching 100 for now to keep simple pagination
        categories: selectedCategories,
        minPrice,
        maxPrice,
        sort
    });

    // 4. Transform Data
    const products: ProductUI[] = ((productsData || []) as ProductsQueryResult[]).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price ?? undefined,
        original_price: p.original_price ?? null,
        image: p.image_url || (p.images && p.images[0]) || '/products/placeholder.png',
        category: p.category?.name || 'Uncategorized',
        isNew: p.is_new ?? undefined,
        isSale: p.is_sale ?? undefined,
        is_new: p.is_new ?? null,
        is_sale: p.is_sale ?? null,
        createdAt: new Date(p.created_at),
        created_at: p.created_at,
        slug: p.slug ?? null,
        description: p.description ?? null,
        category_id: p.category_id ?? null,
        in_stock: p.in_stock ?? null,
        is_featured: p.is_featured ?? null,
        sizes: p.sizes ?? null,
        colors: p.colors ?? null,
        short_description: p.short_description ?? null,
        image_url: p.image_url ?? null,
        images: p.images ?? null,
        is_active: p.is_active,
        stock: p.stock
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

            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="sticky top-32">
                                <ProductFilters categories={categories} />
                            </div>
                        </aside>

                        {/* Main Grid */}
                        <div className="flex-1">
                            <ProductGrid initialProducts={products} />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
