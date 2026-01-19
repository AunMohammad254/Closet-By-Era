import { getOrders } from '@/actions/orders';
import type { Order } from '@/types/database';
import OrdersPageUI from './OrdersPageUI';
import OrdersTableClient from './OrdersTableClient';

export default async function OrdersPage() {
  const result = await getOrders();

  // getOrders returns { data, count } - data is empty array on error
  const orders = result.data || [];

  return (
    <OrdersPageUI orders={orders} error={null}>
      <OrdersTableClient initialOrders={orders} />
    </OrdersPageUI>
  );
}

