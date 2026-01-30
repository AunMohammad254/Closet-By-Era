import { getProducts } from '@/actions/products';
import ProductsTable from '@/components/admin/products/ProductsTable';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

export const metadata = {
    title: 'Products | Admin Dashboard',
};

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string }>;
}) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const search = resolvedParams.search || '';
    const pageSize = 10;

    const result = await getProducts(page, pageSize, search);
    const products = result?.data || [];
    const count = result?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Products</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage your product catalog.</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </Link>
            </div>

            {/* Search */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <form>
                        <input
                            name="search"
                            defaultValue={search}
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all placeholder:text-slate-500"
                        />
                    </form>
                </div>
            </div>

            <ProductsTable products={products as any[]} />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-[#1e293b] px-6 py-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Showing page <span className="font-medium text-slate-200">{page}</span> of <span className="font-medium text-slate-200">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <Link
                            href={`/admin/products?page=${page - 1}&search=${search}`}
                            className={`px-4 py-2 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            Previous
                        </Link>
                        <Link
                            href={`/admin/products?page=${page + 1}&search=${search}`}
                            className={`px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            Next
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
