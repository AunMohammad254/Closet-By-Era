'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { deleteProduct, toggleProductStatus } from '@/actions/products';
import type { Product } from '@/types/database';

interface ProductTableClientProps {
  initialProducts: Product[];
}

export default function ProductTableClient({ initialProducts }: ProductTableClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert(result.error);
      }
      setDeletingId(null);
    });
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleProductStatus(id, !currentStatus);
      if (result.success) {
        setProducts(prev =>
          prev.map(p => (p.id === id ? { ...p, is_active: !currentStatus } : p))
        );
      } else {
        alert(result.error);
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <>
      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={deletingId === product.id ? 'deleting' : ''}>
                <td>
                  <div className="product-cell">
                    <div className="product-image">
                      {product.images && product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={48}
                          height={48}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="placeholder-image">📦</div>
                      )}
                    </div>
                    <div className="product-info">
                      <span className="product-name">{product.name}</span>
                      <span className="product-id">ID: {product.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="category-badge">
                    {typeof product.category === 'object' && product.category
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ? (product.category as any).name
                      : product.category}
                  </span>
                </td>
                <td className="price">{formatPrice(product.price)}</td>
                <td>
                  <span className={`stock-badge ${product.stock === 0 ? 'out-of-stock' : product.stock <= 5 ? 'low-stock' : ''}`}>
                    {product.stock}
                  </span>
                </td>
                <td>
                  <button
                    className={`status-toggle ${product.is_active ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(product.id, product.is_active)}
                    disabled={isPending}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <div className="actions">
                    <Link href={`/dashboard/products/${product.id}/edit`} className="action-btn edit">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.388 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L4.99967 13.6667L1.33301 14.6667L2.33301 11L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="action-btn delete"
                      disabled={isPending || deletingId === product.id}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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

        .products-table {
          width: 100%;
          border-collapse: collapse;
        }

        .products-table th {
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

        .products-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .products-table tr:last-child td {
          border-bottom: none;
        }

        .products-table tr.deleting {
          opacity: 0.5;
          pointer-events: none;
        }

        .product-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-image {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
          background: #f3f4f6;
          flex-shrink: 0;
        }

        .placeholder-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .product-name {
          font-weight: 500;
          color: #1a1a2e;
        }

        .product-id {
          font-size: 12px;
          color: #9ca3af;
        }

        .category-badge {
          display: inline-block;
          padding: 4px 10px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 13px;
          color: #4b5563;
        }

        .price {
          font-weight: 600;
          color: #1a1a2e;
        }

        .stock-badge {
          display: inline-block;
          padding: 4px 10px;
          background: #d1fae5;
          color: #059669;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .stock-badge.low-stock {
          background: #fef3c7;
          color: #d97706;
        }

        .stock-badge.out-of-stock {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-toggle {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .status-toggle.active {
          background: #d1fae5;
          color: #059669;
        }

        .status-toggle.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-toggle:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .status-toggle:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .action-btn.edit {
          background: #eff6ff;
          color: #3b82f6;
          text-decoration: none;
        }

        .action-btn.edit:hover {
          background: #dbeafe;
        }

        .action-btn.delete {
          background: #fef2f2;
          color: #ef4444;
        }

        .action-btn.delete:hover:not(:disabled) {
          background: #fee2e2;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .products-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </>
  );
}
