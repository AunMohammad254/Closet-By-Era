'use client';

import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    stock: number;
    slug: string;
    price: number;
}

interface LowStockAlertProps {
    products: Product[];
}

export default function LowStockAlert({ products }: LowStockAlertProps) {
    if (products.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Inventory Healthy</h3>
                <p className="text-sm text-gray-500 mt-1">No low stock alerts found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Low Stock Alert
                </h3>
                <Link href="/dashboard/products" className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                    View All
                </Link>
            </div>

            <div className="space-y-4">
                {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">Stock: <span className="font-bold text-rose-600">{product.stock} left</span></p>
                        </div>
                        <Link
                            href={`/dashboard/products/${product.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-gray-200 rounded hover:bg-slate-50 transition-colors shrink-0 ml-4"
                        >
                            Restock
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
