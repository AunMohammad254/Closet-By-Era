import { getProducts } from '@/actions/products';
import type { Product } from '@/types/database';
import ProductsPageUI from './ProductsPageUI';
import ProductTableClient from './ProductTableClient';

export default async function ProductsPage() {
  const result = await getProducts();

  // getProducts returns { data, count } - data is empty array on error
  const products: Product[] = (result.data as Product[]) || [];

  return (
    <ProductsPageUI products={products} error={null}>
      <ProductTableClient initialProducts={products} />
    </ProductsPageUI>
  );
}

