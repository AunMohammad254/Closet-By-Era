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
