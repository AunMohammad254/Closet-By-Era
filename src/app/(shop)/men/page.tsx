import DepartmentCatalog from '@/components/shop/DepartmentCatalog';
import { getDepartmentCatalog } from '@/lib/catalog';

export default async function MenPage() {
    // Only this department (root category + sub-categories).
    const { categoryNames, products } = await getDepartmentCatalog('men');

    return (
        <main className="min-h-screen bg-background">
            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 dark:from-slate-900 dark:via-slate-950 dark:to-gray-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-slate-300/30 dark:bg-slate-700/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gray-300/30 dark:bg-gray-700/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-slate-600 dark:text-slate-400 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-foreground mb-4">Men</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Explore our refined collection of men&apos;s fashion. Timeless pieces crafted for the modern gentleman.
                    </p>
                </div>
            </section>

            {/* Products */}
            <DepartmentCatalog
                products={products}
                categories={categoryNames}
                sortOptions={['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling']}
                theme="slate"
                countNoun={['product', 'products']}
                emptyTitle="No products found"
                resetLabel="View All Products"
            />
        </main>
    );
}
