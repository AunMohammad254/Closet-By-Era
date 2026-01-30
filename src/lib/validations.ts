import { z } from 'zod';

// ========================
// Product Validation Schemas
// ========================

export const ProductFormSchema = z.object({
    name: z.string()
        .min(1, 'Product name is required')
        .max(255, 'Product name must be less than 255 characters'),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(5000, 'Description must be less than 5000 characters')
        .optional()
        .or(z.literal('')),
    price: z.number()
        .positive('Price must be a positive number')
        .max(10000000, 'Price seems too high'),
    stock: z.number()
        .int('Stock must be a whole number')
        .min(0, 'Stock cannot be negative'),
    images: z.array(z.string().url('Each image must be a valid URL'))
        .default([]),
    is_active: z.boolean().default(true),
});

export type ValidatedProductFormData = z.infer<typeof ProductFormSchema>;

// ========================
// Order Validation Schemas  
// ========================

export const OrderStatusSchema = z.enum([
    'pending',
    'packed',
    'shipping',
    'delivered',
    'cancelled'
]);

export const PaymentStatusSchema = z.enum([
    'pending',
    'paid',
    'failed',
    'refunded'
]);

export const UpdateOrderStatusSchema = z.object({
    id: z.string().uuid('Invalid order ID'),
    status: OrderStatusSchema,
});

export const UpdatePaymentStatusSchema = z.object({
    id: z.string().uuid('Invalid order ID'),
    status: PaymentStatusSchema,
});

// ========================
// Customer Validation Schemas
// ========================

export const CustomerEmailSchema = z.string()
    .email('Invalid email address')
    .max(255, 'Email too long');

export const CustomerSchema = z.object({
    email: CustomerEmailSchema,
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional(),
});

// ========================
// Coupon Validation Schemas
// ========================

export const CouponFormSchema = z.object({
    code: z.string()
        .min(3, 'Coupon code must be at least 3 characters')
        .max(50, 'Coupon code must be less than 50 characters')
        .regex(/^[A-Za-z0-9_-]+$/, 'Coupon code can only contain letters, numbers, underscores, and hyphens'),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number()
        .positive('Discount value must be positive')
        .max(100000, 'Discount value seems too high'),
    min_order_amount: z.number()
        .min(0, 'Minimum order amount cannot be negative')
        .default(0),
    is_active: z.boolean().default(true),
    start_date: z.string().datetime({ offset: true }).optional().or(z.literal('')),
    end_date: z.string().datetime({ offset: true }).optional().or(z.literal('')),
    usage_limit: z.number().int().positive().nullable().optional(),
});

export type ValidatedCouponFormData = z.infer<typeof CouponFormSchema>;

// ========================
// Gift Card Validation Schemas
// ========================

export const GiftCardFormSchema = z.object({
    code: z.string()
        .min(8, 'Gift card code must be at least 8 characters')
        .max(20, 'Gift card code must be less than 20 characters')
        .optional(),
    initial_value: z.number()
        .positive('Initial value must be positive')
        .max(1000000, 'Initial value seems too high'),
    expires_at: z.string().datetime({ offset: true }).optional().or(z.literal('')),
});

export type ValidatedGiftCardFormData = z.infer<typeof GiftCardFormSchema>;

export const RedeemGiftCardSchema = z.object({
    code: z.string().min(8, 'Invalid gift card code'),
    amount: z.number().positive('Redemption amount must be positive'),
    orderId: z.string().uuid('Invalid order ID'),
});

// ========================
// Common Validators
// ========================

export const UUIDSchema = z.string().uuid('Invalid ID format');

export const PaginationSchema = z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().min(1).max(100).default(10),
});

// ========================
// Helper Functions
// ========================

export function validateProductForm(data: unknown) {
    return ProductFormSchema.safeParse(data);
}

export function validateOrderStatus(data: unknown) {
    return UpdateOrderStatusSchema.safeParse(data);
}

export function validatePaymentStatus(data: unknown) {
    return UpdatePaymentStatusSchema.safeParse(data);
}
