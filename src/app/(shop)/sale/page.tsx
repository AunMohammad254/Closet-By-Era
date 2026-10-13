import DepartmentCatalog from '@/components/shop/DepartmentCatalog';
import { getSaleCatalog } from '@/lib/catalog';

export default async function SalePage() {
    const { categoryNames, products } = await getSaleCatalog();

    return (
        <main className="min-h-screen bg-background">
            {/* Hero */}
            <section className="pt-32 pb-16 bg-linear-to-br from-rose-600 via-rose-500 to-red-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium tracking-wider mb-6">
                        LIMITED TIME
                    </span>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4">
                        Winter Sale
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl mb-8">
                        Up to 50% off on selected items. Don&apos;t miss out on our biggest sale of the season.
                    </p>
                    <div className="flex items-center gap-6 text-white/80">
                        <div>
                            <span className="text-3xl font-bold text-white">50%</span>
                            <span className="block text-sm">Max Discount</span>
                        </div>
                        <div className="w-px h-12 bg-white/30" />
                        <div>
                            <span className="text-3xl font-bold text-white">{products.length}</span>
                            <span className="block text-sm">Items on Sale</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products */}
            <DepartmentCatalog
                products={products}
                categories={categoryNames}
                sortOptions={['Biggest Discount', 'Price: Low to High', 'Price: High to Low']}
                theme="rose"
                countNoun={['item on sale', 'items on sale']}
                emptyTitle="No sale items found"
                resetLabel="View All Sale Items"
                showNewBadge={false}
            />
        </main>
    );
}
