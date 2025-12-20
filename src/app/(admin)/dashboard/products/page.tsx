import { getProducts } from '@/actions/products';
import type { Product } from '@/types/database';
import ProductsPageUI from './ProductsPageUI';
import ProductTableClient from './ProductTableClient';

export default async function ProductsPage() {
  const result = await getProducts();

  const products: Product[] = result.success ? result.data : [];
  const error = !result.success ? result.error : null;

  return (
    <ProductsPageUI products={products} error={error}>
      <ProductTableClient initialProducts={products} />
    </ProductsPageUI>
  );
}
