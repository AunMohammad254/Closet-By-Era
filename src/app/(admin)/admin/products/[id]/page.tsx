import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProductForm from '@/components/admin/products/ProductForm';
import { getCategories, getProductById } from '@/actions/products';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Edit Product | Admin Dashboard',
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;

    const product = await getProductById(resolvedParams.id);
    const categories = await getCategories();

    if (!product) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/products"
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-900"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            </div>

            <ProductForm product={product as any} categories={categories as any[]} />
        </div>
    );
}
