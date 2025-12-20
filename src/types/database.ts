// ============================================================================
// Database Types for Admin Dashboard
// Generated from schema.sql enums and tables
// ============================================================================

// ============================================================================
// Enums
// ============================================================================

export type OrderStatus = 'pending' | 'packed' | 'shipping' | 'delivered' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'cod' | 'bank_transfer' | 'card';

// ============================================================================
// Database Row Types
// ============================================================================

export interface Product {
    id: string;
    created_at: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category: string;
    images: string[];
    is_active: boolean;
}

export interface Order {
    id: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    shipping_address: string;
    total_amount: number;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
}

// ============================================================================
// Extended Types (with relations)
// ============================================================================

export interface OrderWithItems extends Order {
    order_items: (OrderItem & { product?: Product })[];
}

// ============================================================================
// Form Types
// ============================================================================

export interface ProductFormData {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    images: string[];
    is_active: boolean;
}

export interface CreateOrderData {
    customer_name: string;
    customer_email: string;
    shipping_address: string;
    total_amount: number;
    payment_method: PaymentMethod;
    items: {
        product_id: string;
        quantity: number;
        price_at_purchase: number;
    }[];
}

// ============================================================================
// Server Action Response Types (Discriminated Union)
// ============================================================================

export type ActionResponse<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

// ============================================================================
// UI Helper Types
// ============================================================================

export const ORDER_STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    packed: { bg: 'bg-blue-100', text: 'text-blue-800' },
    shipping: { bg: 'bg-purple-100', text: 'text-purple-800' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    paid: { bg: 'bg-green-100', text: 'text-green-800' },
    failed: { bg: 'bg-red-100', text: 'text-red-800' },
    refunded: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    cod: 'Cash on Delivery',
    bank_transfer: 'Bank Transfer',
    card: 'Credit/Debit Card',
};

// Product categories
export const PRODUCT_CATEGORIES = [
    'Outerwear',
    'Dresses',
    'Tops',
    'Bottoms',
    'Accessories',
    'Shoes',
    'Bags',
    'Jewelry',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
