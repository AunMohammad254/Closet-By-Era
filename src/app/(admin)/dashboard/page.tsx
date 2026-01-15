'use client';

import dynamic from 'next/dynamic';
import LowStockAlert from '@/components/admin/dashboard/LowStockAlert';
import { getLowStockProducts } from '@/actions/products';
import { useEffect, useState } from 'react';

// Dynamic import to reduce initial bundle size (~75KB for Recharts)
const AnalyticsCharts = dynamic(() => import('@/components/admin/AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80"></div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80"></div>
    </div>
  )
});

export default function DashboardPage() {
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    getLowStockProducts().then(setLowStockProducts);
  }, []);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to Closet By Era Admin Panel</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 8L12 2L3 8V16L12 22L21 16V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Products</span>
            <span className="stat-value">—</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Orders</span>
            <span className="stat-value">—</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending</span>
            <span className="stat-value">—</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Revenue</span>
            <span className="stat-value">—</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <AnalyticsCharts />
        </div>
        <div>
          <LowStockAlert products={lowStockProducts} />
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <a href="/dashboard/products" className="action-card">
            <span className="action-icon">📦</span>
            <span className="action-text">Manage Products</span>
          </a>
          <a href="/dashboard/orders" className="action-card">
            <span className="action-icon">🛒</span>
            <span className="action-text">View Orders</span>
          </a>
          <a href="/dashboard/products/new" className="action-card">
            <span className="action-icon">➕</span>
            <span className="action-text">Add Product</span>
          </a>
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          max-width: 1200px;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 8px 0;
        }

        .page-header p {
          color: #6b7280;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.products {
          background: #dbeafe;
          color: #3b82f6;
        }

        .stat-icon.orders {
          background: #fef3c7;
          color: #f59e0b;
        }

        .stat-icon.pending {
          background: #fce7f3;
          color: #ec4899;
        }

        .stat-icon.revenue {
          background: #d1fae5;
          color: #10b981;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .quick-actions h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 16px 0;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .action-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
          font-size: 32px;
        }

        .action-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
      `}</style>
    </div>
  );
}
