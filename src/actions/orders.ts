'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { ActionResult } from '@/types/shared';
import type { OrderStatus, PaymentStatus } from '@/types/database';
import { logger } from '@/lib/logger';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import { UpdateOrderStatusSchema, UpdatePaymentStatusSchema, OrderStatusSchema } from '@/lib/validations';
import { sendOrderConfirmationEmail, sendOrderStatusEmail, formatOrderForEmail } from '@/lib/nodemailer';
import { getAdminContext, getSessionUser, FORBIDDEN } from '@/lib/auth';
import { getClientIp } from '@/lib/request';
import {
    calculateCouponDiscount,
    calculateShipping,
    getCouponProblem,
    roundMoney,
} from '@/lib/pricing';

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

const CheckoutSchema = z.object({
    email: z.string().trim().email().max(255),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(1).max(30),
    address: z.string().trim().min(1).max(300),
    apartment: z.string().trim().max(150).optional().default(''),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().max(100).optional().default(''),
    postalCode: z.string().trim().max(20).optional().default(''),
    country: z.string().trim().min(1).max(100),
    shippingMethod: z.enum(['standard', 'express']),
    paymentMethod: z.enum(['cod', 'bank_transfer', 'card', 'jazzcash', 'easypaisa']),
    notes: z.string().trim().max(1000).optional().nullable(),
    code: z.string().trim().max(50).optional().nullable(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        size: z.string().max(50).optional().default(''),
        color: z.string().max(50).optional().default(''),
    })).min(1).max(50),
});

export type CheckoutInput = z.input<typeof CheckoutSchema>;

export interface CreateOrderResult {
    orderId: string;
    orderNumber: string;
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
}

function generateOrderNumber(): string {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `CBE-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Creates an order. Every amount is computed here from database prices;
 * nothing money-related is accepted from the client.
 */
export async function createOrder(input: CheckoutInput): Promise<ActionResult<CreateOrderResult>> {
    const parsed = CheckoutSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: 'Please check your order details and try again.' };
    }
    const data = parsed.data;

    const session = await getSessionUser();
    const rateKey = session ? `user-${session.user.id}` : `ip-${await getClientIp()}`;
    const rateCheck = await checkRateLimit(rateKey, 'create-order', RateLimits.sensitive);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many attempts. Please try again in ${rateCheck.resetIn}s` };
    }

    const admin = createAdminClient();

    try {
        // 1. Price every line from the database.
        const productIds = [...new Set(data.items.map(i => i.productId))];
        const { data: products, error: productsError } = await admin
            .from('products')
            .select('id, name, price, images, image_url, is_active, in_stock')
            .in('id', productIds);

        if (productsError) throw productsError;

        const productMap = new Map(products.map(p => [p.id, p]));
        const lines: { product: (typeof products)[number]; quantity: number; size: string; color: string; unitPrice: number }[] = [];
        for (const item of data.items) {
            const product = productMap.get(item.productId);
            if (!product || !product.is_active || product.in_stock === false) {
                return { success: false, error: `"${product?.name ?? 'An item'}" is no longer available. Please update your cart.` };
            }
            lines.push({
                product,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                unitPrice: Number(product.price),
            });
        }

        const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
        const shippingCost = calculateShipping(subtotal, data.shippingMethod);

        // 2. Resolve the discount code (coupon first, then gift card).
        const code = data.code?.toUpperCase() || null;
        let coupon: { id: string; uses_count: number | null; max_uses: number | null } | null = null;
        let couponDiscount = 0;
        let giftCard: { code: string; amount: number } | null = null;

        if (code) {
            const { data: couponRow } = await admin
                .from('coupons')
                .select('id, discount_type, discount_value, min_order_amount, max_uses, uses_count, starts_at, ends_at, is_active')
                .eq('code', code)
                .maybeSingle();

            if (couponRow) {
                const problem = getCouponProblem(couponRow, subtotal);
                if (problem) return { success: false, error: problem };
                coupon = couponRow;
                couponDiscount = calculateCouponDiscount(couponRow, subtotal);
            } else {
                const { data: card } = await admin
                    .from('gift_cards')
                    .select('code, balance, is_active, expires_at')
                    .eq('code', code)
                    .maybeSingle();

                const usable = card && card.is_active !== false && Number(card.balance) > 0
                    && (!card.expires_at || new Date(card.expires_at) > new Date());
                if (!usable) return { success: false, error: 'Invalid or expired code' };

                const due = subtotal + shippingCost - couponDiscount;
                giftCard = { code: card.code, amount: roundMoney(Math.min(Number(card.balance), due)) };
            }
        }

        const giftCardAmount = giftCard?.amount ?? 0;
        const discount = roundMoney(couponDiscount + giftCardAmount);
        const total = roundMoney(Math.max(0, subtotal + shippingCost - discount));
        const paymentStatus: PaymentStatus = total === 0 && giftCardAmount > 0 ? 'paid' : 'pending';

        // 3. Resolve the customer from the session, never from the client.
        let customerId: string | null = null;
        if (session) {
            const { data: customer } = await admin
                .from('customers')
                .select('id')
                .eq('auth_id', session.user.id)
                .maybeSingle();
            customerId = customer?.id ?? null;
        }

        const shippingAddress = {
            firstName: data.firstName,
            lastName: data.lastName,
            address: data.address,
            apartment: data.apartment,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country,
            phone: data.phone,
        };
        const customerName = `${data.firstName} ${data.lastName}`;
        const orderNumber = generateOrderNumber();

        // 4. Insert order + items. The REST API has no transactions, so roll
        // back by hand if the items fail.
        const { data: order, error: orderError } = await admin
            .from('orders')
            .insert({
                order_number: orderNumber,
                customer_id: customerId,
                customer_email: data.email,
                customer_name: customerName,
                shipping_address: JSON.stringify(shippingAddress),
                subtotal,
                discount,
                shipping_cost: shippingCost,
                total_amount: total,
                payment_method: data.paymentMethod,
                payment_status: paymentStatus,
                status: 'pending',
                notes: data.notes || null,
            })
            .select('id')
            .single();

        if (orderError) throw orderError;

        const { error: itemsError } = await admin.from('order_items').insert(
            lines.map(l => ({
                order_id: order.id,
                product_id: l.product.id,
                product_name: l.product.name,
                product_image: l.product.images?.[0] ?? l.product.image_url ?? null,
                quantity: l.quantity,
                price_at_purchase: l.unitPrice,
                size: l.size || null,
                color: l.color || null,
            }))
        );

        if (itemsError) {
            await admin.from('orders').delete().eq('id', order.id);
            throw itemsError;
        }

        // 5. Consume the coupon / gift card.
        if (giftCard) {
            const { data: redeemed, error: redeemError } = await admin.rpc('redeem_gift_card_atomic', {
                p_code: giftCard.code,
                p_amount: giftCard.amount,
                p_order_id: order.id,
            });
            const result = redeemed as { success?: boolean; amount_redeemed?: number } | null;

            if (redeemError || !result?.success) {
                await admin.from('orders').delete().eq('id', order.id);
                return { success: false, error: 'Gift card could not be applied. Please try again.' };
            }
        }

        if (coupon) {
            const claimed = await claimCouponUse(admin, coupon.id);
            if (!claimed) {
                await admin.from('orders').delete().eq('id', order.id);
                return { success: false, error: 'Coupon usage limit reached' };
            }
        }

        // 6. Loyalty points (1 point per PKR 100 actually paid).
        if (session && customerId) {
            await awardLoyaltyPointsForOrder(admin, session.user.id, customerId, total, orderNumber);
        }

        // 7. Confirmation email after the response is sent.
        after(async () => {
            const result = await sendOrderConfirmationEmail(formatOrderForEmail(
                { order_number: orderNumber, subtotal, shipping_cost: shippingCost, discount, total },
                lines.map(l => ({
                    productName: l.product.name,
                    quantity: l.quantity,
                    size: l.size,
                    color: l.color,
                    unitPrice: l.unitPrice,
                    totalPrice: roundMoney(l.unitPrice * l.quantity),
                })),
                data.email,
                customerName,
                shippingAddress,
                paymentStatus === 'paid' ? 'gift_card' : data.paymentMethod,
            ));
            if (!result.success) logger.warn('Order confirmation email failed', { orderId: order.id });
        });

        revalidatePath('/admin/orders');
        revalidatePath('/account');

        return {
            success: true,
            data: { orderId: order.id, orderNumber, subtotal, shippingCost, discount, total },
        };
    } catch (error) {
        logger.error('Error creating order', error, { action: 'createOrder' });
        return { success: false, error: 'An unexpected error occurred processing your order' };
    }
}

type AdminClient = ReturnType<typeof createAdminClient>;

/** Optimistically increments coupons.uses_count, respecting max_uses under concurrency. */
async function claimCouponUse(admin: AdminClient, couponId: string): Promise<boolean> {
    for (let attempt = 0; attempt < 3; attempt++) {
        const { data: current } = await admin
            .from('coupons')
            .select('uses_count, max_uses')
            .eq('id', couponId)
            .single();
        if (!current) return false;

        const used = current.uses_count ?? 0;
        if (current.max_uses !== null && used >= current.max_uses) return false;

        let query = admin.from('coupons').update({ uses_count: used + 1 }).eq('id', couponId);
        query = current.uses_count === null ? query.is('uses_count', null) : query.eq('uses_count', used);
        const { data: updated } = await query.select('id');
        if (updated && updated.length > 0) return true;
    }
    return false;
}

async function awardLoyaltyPointsForOrder(
    admin: AdminClient,
    authUserId: string,
    customerId: string,
    amountPaid: number,
    orderNumber: string
): Promise<void> {
    const points = Math.floor(amountPaid / 100);
    if (points <= 0) return;

    try {
        const { data: customer } = await admin
            .from('customers')
            .select('loyalty_points')
            .eq('id', customerId)
            .single();

        await admin
            .from('customers')
            .update({ loyalty_points: (customer?.loyalty_points ?? 0) + points })
            .eq('id', customerId);

        await admin.from('loyalty_history').insert({
            user_id: authUserId,
            points,
            reason: `Earned from order ${orderNumber}`,
        });
    } catch (error) {
        // Points are a bonus; never fail the order because of them.
        logger.error('Failed to award loyalty points', error, { action: 'awardLoyaltyPointsForOrder' });
    }
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const ORDER_STATUSES = OrderStatusSchema.options;

function parseStatusFilter(status?: string): OrderStatus | null {
    if (!status || status === 'All') return null;
    const s = status.toLowerCase();
    return (ORDER_STATUSES as readonly string[]).includes(s) ? (s as OrderStatus) : null;
}

export async function getRecentOrders(limit = 5) {
    const ctx = await getAdminContext();
    if (!ctx) return [];

    const { data, error } = await ctx.supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 50));

    if (error) {
        logger.error('Error fetching recent orders', error, { action: 'getRecentOrders' });
        return [];
    }

    return data;
}

export async function getOrders(page = 1, pageSize = 10, status?: string) {
    const ctx = await getAdminContext();
    if (!ctx) return { data: [], count: 0 };

    const size = Math.min(Math.max(pageSize, 1), 100);
    const from = (Math.max(page, 1) - 1) * size;
    const to = from + size - 1;

    let query = ctx.supabase
        .from('orders')
        .select(`
            *,
            customer:customers(first_name, last_name)
        `, { count: 'exact' });

    const statusFilter = parseStatusFilter(status);
    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        logger.error('Error fetching orders', error, { action: 'getOrders', page, status });
        return { data: [], count: 0 };
    }

    return { data, count };
}

export async function getAllOrdersForExport(status?: string) {
    const ctx = await getAdminContext();
    if (!ctx) return [];

    let query = ctx.supabase
        .from('orders')
        .select(`
            *,
            items:order_items(
                *,
                product:products(name)
            ),
            customer:customers(first_name, last_name, email)
        `);

    const statusFilter = parseStatusFilter(status);
    if (statusFilter) query = query.eq('status', statusFilter);

    // Limit to 1000 for safety, can be increased or paginated if needed
    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) {
        logger.error('Error fetching orders for export', error, { action: 'getAllOrdersForExport' });
        return [];
    }

    return data;
}

export async function getOrderById(id: string) {
    const ctx = await getAdminContext();
    if (!ctx) return null;

    const { data, error } = await ctx.supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        logger.error('Error fetching order', error, { action: 'getOrderById', orderId: id });
        return null;
    }

    return data;
}

export async function updateOrderStatus(id: string, newStatus: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const rateCheck = await checkRateLimit(ctx.user.id, 'updateOrderStatus', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    const validation = UpdateOrderStatusSchema.safeParse({ id, status: newStatus.toLowerCase() });
    if (!validation.success) {
        logger.warn('Order status validation failed', { action: 'updateOrderStatus', id, errors: validation.error.issues });
        return { success: false, error: 'Invalid order ID or status' };
    }

    const { data: order, error } = await ctx.supabase
        .from('orders')
        .update({ status: validation.data.status })
        .eq('id', id)
        .select(`
            *,
            customer:customers(first_name, email)
        `)
        .single();

    if (error) {
        logger.error('Error updating order status', error, { action: 'updateOrderStatus', orderId: id });
        return { success: false, error: 'Failed to update order status' };
    }

    const recipient = order.customer?.email ?? order.customer_email;
    if (recipient) {
        after(() =>
            sendOrderStatusEmail(
                recipient,
                order.customer?.first_name || order.customer_name || 'Customer',
                order.order_number || order.id,
                validation.data.status
            ).catch(err => logger.error('Failed to send status email', err, { orderId: id }))
        );
    }

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    return { success: true };
}

export async function updatePaymentStatus(id: string, newStatus: string): Promise<ActionResult> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    const rateCheck = await checkRateLimit(ctx.user.id, 'updatePaymentStatus', RateLimits.mutation);
    if (!rateCheck.allowed) {
        return { success: false, error: `Too many requests. Try again in ${rateCheck.resetIn}s` };
    }

    const validation = UpdatePaymentStatusSchema.safeParse({ id, status: newStatus.toLowerCase() });
    if (!validation.success) {
        logger.warn('Payment status validation failed', { action: 'updatePaymentStatus', id });
        return { success: false, error: 'Invalid order ID or payment status' };
    }

    const { error } = await ctx.supabase
        .from('orders')
        .update({ payment_status: validation.data.status })
        .eq('id', id);

    if (error) {
        logger.error('Error updating payment status', error, { action: 'updatePaymentStatus', orderId: id });
        return { success: false, error: 'Failed to update payment status' };
    }

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    return { success: true };
}

/**
 * Bulk update order statuses
 */
export async function bulkUpdateOrderStatus(
    orderIds: string[],
    newStatus: string
): Promise<ActionResult<{ updated: number; failed: number }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    if (!orderIds.length) {
        return { success: false, error: 'No orders selected' };
    }

    if (orderIds.length > 100) {
        return { success: false, error: 'Maximum 100 orders can be updated at once' };
    }

    const status = parseStatusFilter(newStatus);
    if (!status) {
        return { success: false, error: 'Invalid status' };
    }

    const { data, error } = await ctx.supabase
        .from('orders')
        .update({ status })
        .in('id', orderIds)
        .select('id');

    if (error) {
        logger.error('Error bulk updating orders', error, { action: 'bulkUpdateOrderStatus', count: orderIds.length });
        return { success: false, error: 'Failed to update orders' };
    }

    const updated = data?.length || 0;
    const failed = orderIds.length - updated;

    revalidatePath('/admin/orders');
    return { success: true, data: { updated, failed } };
}

/**
 * Delete multiple orders (for cancelled/old orders cleanup)
 */
export async function bulkDeleteOrders(orderIds: string[]): Promise<ActionResult<{ deleted: number }>> {
    const ctx = await getAdminContext();
    if (!ctx) return { success: false, error: FORBIDDEN };

    if (!orderIds.length) {
        return { success: false, error: 'No orders selected' };
    }

    if (orderIds.length > 50) {
        return { success: false, error: 'Maximum 50 orders can be deleted at once' };
    }

    const { error, count } = await ctx.supabase
        .from('orders')
        .delete({ count: 'exact' })
        .in('id', orderIds);

    if (error) {
        logger.error('Error bulk deleting orders', error, { action: 'bulkDeleteOrders', count: orderIds.length });
        return { success: false, error: 'Failed to delete orders' };
    }

    revalidatePath('/admin/orders');
    return { success: true, data: { deleted: count || 0 } };
}

