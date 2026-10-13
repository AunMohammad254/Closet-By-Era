import DepartmentCatalog from '@/components/shop/DepartmentCatalog';
import { getDepartmentCatalog } from '@/lib/catalog';

export default async function AccessoriesPage() {
    // Only this department (root category + sub-categories).
    const { categoryNames, products } = await getDepartmentCatalog('accessories');

    return (
        <main className="min-h-screen bg-background">
            {/* Hero */}
            <section className="pt-32 pb-16 bg-linear-to-br from-amber-50/50 via-orange-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/30 dark:bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/20 dark:bg-yellow-500/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-foreground mb-4">Accessories</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Complete your look with our curated selection of premium accessories. From elegant jewelry to statement bags.
                    </p>
                </div>
            </section>

            {/* Products */}
            <DepartmentCatalog
                products={products}
                categories={categoryNames}
                sortOptions={['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling']}
                theme="amber"
                countNoun={['product', 'products']}
                emptyTitle="No products found"
                resetLabel="View All Products"
            />
        </main>
    );
}
