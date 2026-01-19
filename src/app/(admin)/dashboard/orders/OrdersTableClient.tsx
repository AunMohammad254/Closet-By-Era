'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus, updatePaymentStatus } from '@/actions/orders';
import type { Order, OrderStatus, PaymentStatus } from '@/types/database';
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/types/database';

interface OrdersTableClientProps {
  initialOrders: Order[];
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'packed', 'shipping', 'delivered', 'cancelled'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

export default function OrdersTableClient({ initialOrders }: OrdersTableClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        alert(result.error);
      }
      setUpdatingId(null);
    });
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
    setUpdatingId(orderId);
    startTransition(async () => {
      const result = await updatePaymentStatus(orderId, newStatus);
      if (result.success) {
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, payment_status: newStatus } : o))
        );
      } else {
        alert(result.error);
      }
      setUpdatingId(null);
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <>
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusColors = ORDER_STATUS_COLORS[order.status];
              const paymentColors = PAYMENT_STATUS_COLORS[order.payment_status];
              const isUpdating = updatingId === order.id;

              return (
                <tr key={order.id} className={isUpdating ? 'updating' : ''}>
                  <td>
                    <div className="order-cell">
                      <span className="order-id">#{order.id.slice(0, 8)}</span>
                      <span className="payment-method">{PAYMENT_METHOD_LABELS[order.payment_method]}</span>
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-name">{order.customer_name}</span>
                      <span className="customer-email">{order.customer_email}</span>
                    </div>
                  </td>
                  <td className="total">{formatPrice(order.total)}</td>
                  <td>
                    <div className="status-dropdown-wrapper">
                      <select
                        value={order.payment_status}
                        onChange={(e) => handlePaymentStatusChange(order.id, e.target.value as PaymentStatus)}
                        disabled={isPending}
                        className={`status-select ${paymentColors.bg} ${paymentColors.text}`}
                        style={{
                          backgroundColor: paymentColors.bg.replace('bg-', ''),
                          color: paymentColors.text.replace('text-', ''),
                        }}
                      >
                        {PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <div className="status-dropdown-wrapper">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={isPending}
                        className={`status-select ${statusColors.bg} ${statusColors.text}`}
                        style={{
                          backgroundColor: statusColors.bg.replace('bg-', ''),
                          color: statusColors.text.replace('text-', ''),
                        }}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="date">{formatDate(order.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .table-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .orders-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .orders-table tr:last-child td {
          border-bottom: none;
        }

        .orders-table tr.updating {
          opacity: 0.6;
        }

        .order-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .order-id {
          font-weight: 600;
          color: #1a1a2e;
          font-family: monospace;
        }

        .payment-method {
          font-size: 12px;
          color: #9ca3af;
        }

        .customer-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .customer-name {
          font-weight: 500;
          color: #1a1a2e;
        }

        .customer-email {
          font-size: 12px;
          color: #9ca3af;
        }

        .total {
          font-weight: 600;
          color: #1a1a2e;
        }

        .status-dropdown-wrapper {
          position: relative;
        }

        .status-select {
          appearance: none;
          padding: 6px 28px 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          transition: all 0.2s ease;
        }

        .status-select:hover:not(:disabled) {
          transform: scale(1.02);
        }

        .status-select:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Status colors */
        .status-select[value="pending"] {
          background-color: #fef3c7 !important;
          color: #92400e !important;
        }

        .status-select[value="packed"] {
          background-color: #dbeafe !important;
          color: #1e40af !important;
        }

        .status-select[value="shipping"] {
          background-color: #f3e8ff !important;
          color: #6b21a8 !important;
        }

        .status-select[value="delivered"] {
          background-color: #d1fae5 !important;
          color: #065f46 !important;
        }

        .status-select[value="cancelled"] {
          background-color: #fee2e2 !important;
          color: #991b1b !important;
        }

        .status-select[value="paid"] {
          background-color: #d1fae5 !important;
          color: #065f46 !important;
        }

        .status-select[value="failed"] {
          background-color: #fee2e2 !important;
          color: #991b1b !important;
        }

        .status-select[value="refunded"] {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
        }

        .date {
          font-size: 13px;
          color: #6b7280;
          white-space: nowrap;
        }

        @media (max-width: 1024px) {
          .orders-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </>
  );
}
