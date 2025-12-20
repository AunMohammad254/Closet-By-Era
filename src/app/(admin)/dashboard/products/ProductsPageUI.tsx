'use client';

import Link from 'next/link';
import type { Product } from '@/types/database';

interface ProductsPageUIProps {
    products: Product[];
    error: string | null;
    children: React.ReactNode;
}

export default function ProductsPageUI({ products, error, children }: ProductsPageUIProps) {
    return (
        <div className="products-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>Products</h1>
                    <p>Manage your product catalog</p>
                </div>
                <Link href="/dashboard/products/new" className="btn-primary">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add Product
                </Link>
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

            {products.length === 0 && !error ? (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No products yet</h3>
                    <p>Get started by adding your first product</p>
                    <Link href="/dashboard/products/new" className="btn-primary">Add Product</Link>
                </div>
            ) : (
                children
            )}

            <style jsx>{`
        .products-page {
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

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-weight: 600;
          font-size: 14px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
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
          margin: 0 0 24px 0;
        }
      `}</style>
        </div>
    );
}
