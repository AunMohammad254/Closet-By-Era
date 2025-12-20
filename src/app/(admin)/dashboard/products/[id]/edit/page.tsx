import { notFound } from 'next/navigation';
import { getProductById } from '@/actions/products';
import EditProductUI from './EditProductUI';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const result = await getProductById(id);

  if (!result.success) {
    notFound();
  }

  return <EditProductUI product={result.data} />;
}
