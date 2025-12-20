import { getOrders } from '@/actions/orders';
import type { Order } from '@/types/database';
import OrdersPageUI from './OrdersPageUI';
import OrdersTableClient from './OrdersTableClient';

export default async function OrdersPage() {
  const result = await getOrders();

  const orders: Order[] = result.success ? result.data : [];
  const error = !result.success ? result.error : null;

  return (
    <OrdersPageUI orders={orders} error={error}>
      <OrdersTableClient initialOrders={orders} />
    </OrdersPageUI>
  );
}
