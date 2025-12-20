'use client';

import type { Order } from '@/types/database';

interface OrdersPageUIProps {
    orders: Order[];
    error: string | null;
    children: React.ReactNode;
}

export default function OrdersPageUI({ orders, error, children }: OrdersPageUIProps) {
    return (
        <div className="orders-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>Orders</h1>
                    <p>Manage and track customer orders</p>
                </div>
            </header>

            {error && (
                <div className="error-message">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 6V10M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {error}
                </div>
            )}

            {orders.length === 0 && !error ? (
                <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <h3>No orders yet</h3>
                    <p>Orders will appear here when customers make purchases</p>
                </div>
            ) : (
                children
            )}

            <style jsx>{`
        .orders-page {
          max-width: 1400px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .header-content h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 8px 0;
        }

        .header-content p {
          color: #6b7280;
          margin: 0;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          margin-bottom: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0;
        }
      `}</style>
        </div>
    );
}
