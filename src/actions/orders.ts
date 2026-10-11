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
import { UpdateOrderStatusSchema, UpdatePaymentStatusSchema, OrderStatusSchema, PaymentStatusSchema } from '@/lib/validations';
import { sendOrderConfirmationEmail, sendOrderStatusEmail, formatOrderForEmail } from '@/lib/email/orders';
import { getAdminContext, getSessionUser, FORBIDDEN } from '@/lib/auth';
import { getClientIp } from '@/lib/request';
import {
    calculateCouponDiscount,
    calculateShipping,
    getCouponProblem,
    roundMoney,
} from '@/lib/pricing';
import { CHECKOUT_PAYMENT_METHODS, getPaymentDetails, isPaymentMethodAvailable } from '@/lib/payments';
import { loadPaymentSettings } from '@/lib/store-settings';
import { isCardPaymentReady } from '@/lib/stripe';
import { createCardCheckout, expireCheckoutSession } from '@/lib/card-payments';
import { getRequestOrigin } from '@/lib/request';

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
    paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
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
    /** Card orders: send the customer here (Stripe Checkout) to pay. */
    paymentUrl?: string;
}

function stockError(name: string, available: number): string {
    return available > 0
        ? `Only ${available} of "${name}" left in stock. Please update your cart.`
        : `"${name}" is out of stock. Please update your cart.`;
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
            .select('id, name, price, stock, images, image_url, is_active, in_stock')
            .in('id', productIds);

        if (productsError) throw productsError;

        const productMap = new Map(products.map(p => [p.id, p]));

        // Friendly early check; reserve_order_stock below is the atomic one.
        const requested = new Map<string, number>();
        for (const item of data.items) {
            requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
        }
        for (const [productId, quantity] of requested) {
            const product = productMap.get(productId);
            if (product && product.stock < quantity) {
                return { success: false, error: stockError(product.name, product.stock) };
            }
        }
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

        // Only methods the store has enabled and configured (Admin > Settings).
        const { payment: paymentSettings } = await loadPaymentSettings();
        if (paymentStatus !== 'paid'
            && !isPaymentMethodAvailable(paymentSettings, data.paymentMethod, { cardReady: isCardPaymentReady() })) {
            return { success: false, error: 'That payment method is not available. Please choose another.' };
        }
        const payByCard = data.paymentMethod === 'card' && paymentStatus !== 'paid';

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

        // 5. Take the stock (every line or none). From here on, deleting the
        // order puts it back (DB trigger sync_order_stock).
        const { error: reserveError } = await admin.rpc('reserve_order_stock', { p_order_id: order.id });
        if (reserveError) {
            await admin.from('orders').delete().eq('id', order.id);
            if (reserveError.hint === 'insufficient_stock') {
                logger.warn('Stock ran out during checkout', { orderId: order.id, detail: reserveError.message });
                return { success: false, error: 'Some items just sold out. Please review your cart and try again.' };
            }
            throw reserveError;
        }

        // 6. Card: open a Stripe Checkout session before any discount is
        // consumed, so a Stripe failure can still delete the order cleanly.
        let cardCheckout: { url: string; sessionId: string } | null = null;
        if (payByCard) {
            try {
                cardCheckout = await createCardCheckout({
                    orderId: order.id,
                    orderNumber,
                    total,
                    email: data.email,
                    summary: lines.map(l => `${l.quantity} × ${l.product.name}`).join(', '),
                    couponId: coupon?.id ?? null,
                    origin: await getRequestOrigin(),
                });
            } catch (error) {
                await admin.from('orders').delete().eq('id', order.id);
                logger.error('Could not start card payment', error, { orderId: order.id });
                return { success: false, error: 'Card payment is unavailable right now. Please choose another payment method.' };
            }
        }

        const abandon = async () => {
            if (cardCheckout) await expireCheckoutSession(cardCheckout.sessionId);
            await admin.from('orders').delete().eq('id', order.id);
        };

        // 7. Consume the coupon / gift card.
        if (giftCard) {
            const { data: redeemed, error: redeemError } = await admin.rpc('redeem_gift_card_atomic', {
                p_code: giftCard.code,
                p_amount: giftCard.amount,
                p_order_id: order.id,
            });
            const result = redeemed as { success?: boolean; amount_redeemed?: number } | null;

            if (redeemError || !result?.success) {
                await abandon();
                return { success: false, error: 'Gift card could not be applied. Please try again.' };
            }
        }

        if (coupon) {
            const claimed = await claimCouponUse(admin, coupon.id);
            if (!claimed) {
                await abandon();
                return { success: false, error: 'Coupon usage limit reached' };
            }
        }

        // 8. Loyalty points (1 point per PKR 100 actually paid).
        if (session && customerId) {
            await awardLoyaltyPointsForOrder(admin, session.user.id, customerId, total, orderNumber);
        }

        revalidatePath('/admin/orders');
        revalidatePath('/account');

        // Card orders are confirmed by email once Stripe reports the payment.
        if (cardCheckout) {
            return {
                success: true,
                data: { orderId: order.id, orderNumber, subtotal, shippingCost, discount, total, paymentUrl: cardCheckout.url },
            };
        }

        // 9. Confirmation email after the response is sent.
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
                paymentStatus === 'paid' ? [] : getPaymentDetails(paymentSettings, data.paymentMethod),
                paymentStatus === 'paid',
            ));
            if (!result.success) logger.warn('Order confirmation email failed', { orderId: order.id });
        });

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

/** Reinstating a cancelled order re-takes its stock; the DB refuses if it is gone. */
function stockConflictMessage(error: { hint?: string | null; message: string }): string | null {
    return error.hint === 'insufficient_stock'
        ? `${error.message}. Restock it before reinstating this order.`
        : null;
}

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

/** Admin order list filters; every field arrives from the URL, so all are optional. */
export interface OrderFilters {
    status?: string;
    search?: string;
    payment_status?: string;
    payment_method?: string;
    /** YYYY-MM-DD, inclusive */
    from?: string;
    /** YYYY-MM-DD, inclusive */
    to?: string;
}

// Date filters are calendar days in Pakistan time.
const STORE_UTC_OFFSET = '+05:00';
const DateFilter = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const lower = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : v);

const OrderFiltersSchema = z.object({
    status: z.preprocess(lower, OrderStatusSchema).optional().catch(undefined),
    payment_status: z.preprocess(lower, PaymentStatusSchema).optional().catch(undefined),
    payment_method: z.enum(['cod', 'bank_transfer', 'card', 'jazzcash', 'easypaisa']).optional().catch(undefined),
    from: DateFilter.optional().catch(undefined),
    to: DateFilter.optional().catch(undefined),
    // Keep only characters with no meaning in PostgREST filter syntax.
    search: z.string()
        .transform(s => s.replace(/[^\p{L}\p{N}@._+\- ]/gu, '').trim().slice(0, 100))
        .optional()
        .catch(undefined),
});

function applyOrderFilters<Q extends {
    eq(column: string, value: string): Q;
    gte(column: string, value: string): Q;
    lte(column: string, value: string): Q;
    or(filters: string): Q;
}>(query: Q, raw: OrderFilters = {}): Q {
    const f = OrderFiltersSchema.parse(raw);
    let q = query;
    if (f.status) q = q.eq('status', f.status);
    if (f.payment_status) q = q.eq('payment_status', f.payment_status);
    if (f.payment_method) q = q.eq('payment_method', f.payment_method);
    if (f.from) q = q.gte('created_at', `${f.from}T00:00:00${STORE_UTC_OFFSET}`);
    if (f.to) q = q.lte('created_at', `${f.to}T23:59:59.999${STORE_UTC_OFFSET}`);
    if (f.search) {
        const term = `%${f.search}%`;
        q = q.or(`order_number.ilike.${term},customer_name.ilike.${term},customer_email.ilike.${term}`);
    }
    return q;
}

export async function getOrders(page = 1, pageSize = 10, filters: OrderFilters = {}) {
    const ctx = await getAdminContext();
    if (!ctx) return { data: [], count: 0 };

    const size = Math.min(Math.max(pageSize, 1), 100);
    const from = (Math.max(page, 1) - 1) * size;
    const to = from + size - 1;

    const query = applyOrderFilters(
        ctx.supabase
            .from('orders')
            .select(`
                *,
                customer:customers(first_name, last_name)
            `, { count: 'exact' }),
        filters
    );

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        logger.error('Error fetching orders', error, { action: 'getOrders', page });
        return { data: [], count: 0 };
    }

    return { data, count };
}

export async function getAllOrdersForExport(filters: OrderFilters = {}) {
    const ctx = await getAdminContext();
    if (!ctx) return [];

    const query = applyOrderFilters(
        ctx.supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    *,
                    product:products(name)
                ),
                customer:customers(first_name, last_name, email)
            `),
        filters
    );

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
        return { success: false, error: stockConflictMessage(error) ?? 'Failed to update order status' };
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
        return { success: false, error: stockConflictMessage(error) ?? 'Failed to update orders' };
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

