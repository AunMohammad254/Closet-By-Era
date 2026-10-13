import NewArrivalsCatalog from '@/components/shop/NewArrivalsCatalog';
import { getNewArrivalsCatalog } from '@/lib/catalog';

export default async function NewArrivalsPage() {
    const { categoryNames, products } = await getNewArrivalsCatalog();

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Banner */}
            <div className="relative bg-linear-to-r from-slate-900 via-rose-950 to-slate-900 text-white py-16 sm:py-20 overflow-hidden">
                <div className="absolute inset-0 bg-radial-[ellipse_at_top] from-rose-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-4">
                        Fresh Releases
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                        New Arrivals
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                        Explore our latest contemporary designs, seasonal fabrics, and limited releases.
                    </p>
                </div>
            </div>

            <NewArrivalsCatalog products={products} categories={categoryNames} />
        </div>
    );
}
