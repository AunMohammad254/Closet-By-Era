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

    // @ts-ignore
    const { data: products, count } = await getProducts(page, pageSize, search);
    // const totalPages = Math.ceil((count || 0) / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your product catalog.</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <form>
                        <input
                            name="search"
                            defaultValue={search}
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        />
                    </form>
                </div>
            </div>

            <ProductsTable products={products as any[]} />

            {/* Pagination Placeholder (Simple) */}
            <div className="flex justify-center pt-4">
                {/* Add pagination controls matching orders page if strict consistency needed */}
            </div>
        </div>
    );
}
