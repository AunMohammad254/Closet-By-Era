'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createProduct, updateProduct, uploadProductImage } from '@/actions/products';
import type { Product, ProductFormData } from '@/types/database';
import { PRODUCT_CATEGORIES } from '@/types/database';

interface ProductFormProps {
    product?: Product;
    mode: 'create' | 'edit';
}

export default function ProductForm({ product, mode }: ProductFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<ProductFormData>({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || 0,
        stock: product?.stock || 0,
        category: product?.category || PRODUCT_CATEGORIES[0],
        images: product?.images || [],
        is_active: product?.is_active ?? true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Product name is required';
        }

        if (formData.price < 0) {
            newErrors.price = 'Price cannot be negative';
        }

        if (formData.stock < 0) {
            newErrors.stock = 'Stock cannot be negative';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newImages: string[] = [];

        for (const file of Array.from(files)) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const result = await uploadProductImage(formDataUpload);
            if (result.success) {
                newImages.push(result.data);
            } else {
                alert(`Failed to upload ${file.name}: ${result.error}`);
            }
        }

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImages],
        }));
        setIsUploading(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        startTransition(async () => {
            const result = mode === 'create'
                ? await createProduct(formData)
                : await updateProduct(product!.id, formData);

            if (result.success) {
                router.push('/dashboard/products');
            } else {
                setErrors({ submit: result.error });
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="product-form">
            {errors.submit && (
                <div className="error-banner">{errors.submit}</div>
            )}

            <div className="form-section">
                <h3>Basic Information</h3>

                <div className="form-group">
                    <label htmlFor="name">Product Name *</label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter product name"
                        className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter product description"
                        rows={4}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="price">Price ($) *</label>
                        <input
                            type="number"
                            id="price"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            min="0"
                            step="0.01"
                            className={errors.price ? 'error' : ''}
                        />
                        {errors.price && <span className="error-text">{errors.price}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="stock">Stock *</label>
                        <input
                            type="number"
                            id="stock"
                            value={formData.stock}
                            onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                            min="0"
                            className={errors.stock ? 'error' : ''}
                        />
                        {errors.stock && <span className="error-text">{errors.stock}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className={errors.category ? 'error' : ''}
                    >
                        {PRODUCT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    {errors.category && <span className="error-text">{errors.category}</span>}
                </div>

                <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        />
                        <span className="checkmark"></span>
                        Product is active and visible to customers
                    </label>
                </div>
            </div>

            <div className="form-section">
                <h3>Product Images</h3>

                <div className="images-grid">
                    {formData.images.map((url, index) => (
                        <div key={index} className="image-item">
                            <Image
                                src={url}
                                alt={`Product image ${index + 1}`}
                                width={120}
                                height={120}
                                style={{ objectFit: 'cover' }}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="remove-image"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    <label className="upload-area">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            multiple
                            disabled={isUploading}
                        />
                        {isUploading ? (
                            <div className="uploading">
                                <div className="spinner"></div>
                                <span>Uploading...</span>
                            </div>
                        ) : (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Click to upload</span>
                            </>
                        )}
                    </label>
                </div>
                <p className="help-text">Upload product images (max 5MB each). Images will be stored in Supabase Storage.</p>
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn-secondary"
                    disabled={isPending}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isPending || isUploading}
                >
                    {isPending ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
                </button>
            </div>

            <style jsx>{`
        .product-form {
          max-width: 800px;
        }

        .error-banner {
          padding: 16px 20px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          margin-bottom: 24px;
        }

        .form-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
          color: #1a1a2e;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group input.error,
        .form-group textarea.error,
        .form-group select.error {
          border-color: #ef4444;
        }

        .error-text {
          display: block;
          font-size: 12px;
          color: #ef4444;
          margin-top: 6px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .checkbox-group {
          margin-top: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          accent-color: #6366f1;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
        }

        .image-item {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .remove-image {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          transition: background 0.2s ease;
        }

        .remove-image:hover {
          background: rgba(239, 68, 68, 0.9);
        }

        .upload-area {
          width: 120px;
          height: 120px;
          border: 2px dashed #e5e7eb;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #9ca3af;
        }

        .upload-area:hover {
          border-color: #6366f1;
          color: #6366f1;
        }

        .upload-area input {
          display: none;
        }

        .upload-area span {
          font-size: 12px;
        }

        .uploading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .help-text {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 12px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </form>
    );
}
