'use client';

import Link from 'next/link';
import type { Product } from '@/types/database';
import ProductForm from '../../ProductForm';

interface EditProductUIProps {
    product: Product;
}

export default function EditProductUI({ product }: EditProductUIProps) {
    return (
        <div className="edit-product-page">
            <header className="page-header">
                <Link href="/dashboard/products" className="back-link">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Products
                </Link>
                <h1>Edit Product</h1>
                <p>Update product details</p>
            </header>

            <ProductForm mode="edit" product={product} />

            <style jsx>{`
        .edit-product-page {
          max-width: 800px;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #6b7280;
          text-decoration: none;
          margin-bottom: 16px;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #1a1a2e;
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
      `}</style>
        </div>
    );
}
