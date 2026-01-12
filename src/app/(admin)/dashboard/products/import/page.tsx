import ProductImportForm from '@/components/admin/products/ProductImportForm';
import Link from 'next/link';

export default function ImportProductsPage() {
    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/products"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Import Products</h1>
                    <p className="text-gray-500">Bulk upload inventory via CSV</p>
                </div>
            </div>

            <ProductImportForm />
        </div>
    );
}
