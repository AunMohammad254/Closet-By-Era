import { notFound } from 'next/navigation';
import { getProductById } from '@/actions/products';
import EditProductUI from './EditProductUI';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <EditProductUI product={product as any} />;
}
