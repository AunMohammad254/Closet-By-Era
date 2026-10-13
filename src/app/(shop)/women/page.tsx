import DepartmentCatalog from '@/components/shop/DepartmentCatalog';
import { getDepartmentCatalog } from '@/lib/catalog';

export default async function WomenPage() {
    // Only this department (root category + sub-categories).
    const { categoryNames, products } = await getDepartmentCatalog('women');

    return (
        <main className="min-h-screen bg-background">
            {/* Hero */}
            <section className="pt-32 pb-16 bg-linear-to-br from-rose-50/50 via-pink-50/50 to-amber-50/50 dark:from-rose-950/20 dark:via-pink-950/20 dark:to-amber-950/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/30 dark:bg-rose-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/30 dark:bg-amber-500/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-rose-600 dark:text-rose-400 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-foreground mb-4">Women</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Discover our curated selection of premium women&apos;s fashion. From elegant dresses to everyday essentials.
                    </p>
                </div>
            </section>

            {/* Products */}
            <DepartmentCatalog
                products={products}
                categories={categoryNames}
                sortOptions={['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling']}
                theme="rose"
                countNoun={['product', 'products']}
                emptyTitle="No products found"
                resetLabel="View All Products"
            />
        </main>
    );
}
