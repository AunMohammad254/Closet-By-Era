import { Database } from './supabase';

// ============================================================================
// Enums
// ============================================================================

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

// ============================================================================
// Database Row Types (Derived from Supabase)
// ============================================================================

export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type WishlistItem = Database['public']['Tables']['wishlist_items']['Row'];
export type CartItem = Database['public']['Tables']['cart_items']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];

// ============================================================================
// Extended Types (with relations)
// ============================================================================

export interface OrderWithItems extends Order {
    order_items: (OrderItem & { product: Product | null })[];
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
// Server Action Response Types
// ============================================================================

export type ActionResponse<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

// ============================================================================
// UI Helper Types & Constants
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
