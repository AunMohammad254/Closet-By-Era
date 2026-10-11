import 'server-only';

import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { parseShippingAddress } from '@/lib/order-display';
import { formatOrderForEmail, sendOrderConfirmationEmail } from '@/lib/email/orders';

/**
 * Card orders: createOrder inserts a pending order (stock reserved), then the
 * customer pays on Stripe's hosted Checkout page. The order becomes paid when
 * Stripe confirms (webhook, or the success page as a fallback) and is
 * cancelled, returning stock and discounts, if the session expires or the
 * customer cancels. All handlers are idempotent: whichever runs first wins.
 */

// Shortest expiry Stripe allows; abandoned orders hold stock this long.
const CHECKOUT_EXPIRY_SECONDS = 30 * 60;

export interface CardCheckoutInput {
    orderId: string;
    orderNumber: string;
    /** Amount to charge, PKR. */
    total: number;
    email: string;
    summary: string;
    couponId: string | null;
    /** Origin to return to after payment, e.g. https://shop.example. */
    origin: string;
}

export async function createCardCheckout(input: CardCheckoutInput): Promise<{ url: string; sessionId: string }> {
    const stripe = getStripe();
    if (!stripe) throw new Error('Card payments are not configured');

    const metadata = {
        order_id: input.orderId,
        order_number: input.orderNumber,
        ...(input.couponId ? { coupon_id: input.couponId } : {}),
    };

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: input.orderId,
        customer_email: input.email,
        line_items: [{
            quantity: 1,
            price_data: {
                currency: 'pkr',
                // PKR is a two-decimal currency for Stripe: amounts are in paisa.
                unit_amount: Math.round(input.total * 100),
                product_data: {
                    name: `Closet By Era order ${input.orderNumber}`,
                    description: input.summary.slice(0, 500) || undefined,
                },
            },
        }],
        metadata,
        payment_intent_data: { metadata },
        expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_SECONDS,
        success_url: `${input.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/checkout/cancelled?session_id={CHECKOUT_SESSION_ID}`,
    }, { idempotencyKey: `checkout-${input.orderId}` });

    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return { url: session.url, sessionId: session.id };
}

export async function expireCheckoutSession(sessionId: string): Promise<void> {
    try {
        await getStripe()?.checkout.sessions.expire(sessionId);
    } catch (error) {
        // Already expired or completed: nothing to do.
        logger.warn('Could not expire checkout session', { sessionId, reason: (error as Error).message });
    }
}

export type SettleResult =
    | { state: 'paid'; orderNumber: string }
    | { state: 'pending'; orderNumber: string }
    | { state: 'cancelled'; orderNumber: string }
    | { state: 'unknown' };

/** Marks the order paid (once) and sends the confirmation email. */
async function markOrderPaid(orderId: string): Promise<string | null> {
    const admin = createAdminClient();
    const { data: order } = await admin
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)
        .eq('payment_method', 'card')
        .eq('payment_status', 'pending')
        .select('*, items:order_items(*)')
        .maybeSingle();

    if (!order) return null; // already handled

    const address = parseShippingAddress(order.shipping_address);
    const result = await sendOrderConfirmationEmail(formatOrderForEmail(
        { order_number: order.order_number ?? undefined, subtotal: order.subtotal ?? 0, shipping_cost: order.shipping_cost ?? 0, discount: order.discount ?? 0, total: order.total_amount },
        order.items.map(item => ({
            productName: item.product_name ?? 'Item',
            quantity: item.quantity,
            size: item.size ?? undefined,
            color: item.color ?? undefined,
            unitPrice: item.price_at_purchase,
            totalPrice: item.price_at_purchase * item.quantity,
        })),
        order.customer_email,
        order.customer_name,
        {
            firstName: address.firstName ?? '',
            lastName: address.lastName ?? '',
            address: address.address ?? '',
            apartment: address.apartment,
            city: address.city ?? '',
            state: address.state,
            postalCode: address.postalCode ?? '',
            country: address.country ?? '',
            phone: address.phone ?? '',
        },
        'card',
        [],
        true
    ));
    if (!result.success) logger.warn('Paid order confirmation email failed', { orderId });

    return order.order_number;
}

/**
 * Cancels an unpaid card order: the DB trigger returns its stock; here the
 * gift card balance and the coupon use are given back too.
 */
export async function cancelUnpaidCardOrder(orderId: string, couponId: string | null): Promise<string | null> {
    const admin = createAdminClient();
    const { data: order } = await admin
        .from('orders')
        .update({ status: 'cancelled', payment_status: 'failed' })
        .eq('id', orderId)
        .eq('payment_method', 'card')
        .eq('payment_status', 'pending')
        .eq('status', 'pending')
        .select('order_number')
        .maybeSingle();

    if (!order) return null; // paid, or already cancelled

    try {
        const { data: usages } = await admin
            .from('gift_card_usage')
            .select('id, gift_card_id, amount_used')
            .eq('order_id', orderId);
        for (const usage of usages ?? []) {
            const { data: card } = await admin.from('gift_cards').select('balance').eq('id', usage.gift_card_id).single();
            if (card) {
                await admin.from('gift_cards').update({ balance: Number(card.balance) + Number(usage.amount_used) }).eq('id', usage.gift_card_id);
            }
            await admin.from('gift_card_usage').delete().eq('id', usage.id);
        }

        if (couponId) {
            const { data: coupon } = await admin.from('coupons').select('uses_count').eq('id', couponId).single();
            if (coupon?.uses_count) {
                await admin.from('coupons').update({ uses_count: coupon.uses_count - 1 }).eq('id', couponId);
            }
        }
    } catch (error) {
        logger.error('Failed to release discounts for cancelled card order', error, { orderId });
    }

    logger.info('Cancelled unpaid card order', { orderId });
    return order.order_number;
}

/** True when the session's order belongs to this signed-in user. */
export async function sessionBelongsToUser(session: Stripe.Checkout.Session, authUserId: string): Promise<boolean> {
    const orderId = session.metadata?.order_id;
    if (!orderId) return false;
    const admin = createAdminClient();
    const { data: order } = await admin
        .from('orders')
        .select('customer:customers(auth_id)')
        .eq('id', orderId)
        .maybeSingle();
    return order?.customer?.auth_id === authUserId;
}

/** Applies a Checkout Session's outcome to its order. */
export async function settleCheckoutSession(session: Stripe.Checkout.Session): Promise<SettleResult> {
    const orderId = session.metadata?.order_id;
    const orderNumber = session.metadata?.order_number ?? '';
    if (!orderId) return { state: 'unknown' };

    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        await markOrderPaid(orderId);
        return { state: 'paid', orderNumber };
    }
    if (session.status === 'expired') {
        await cancelUnpaidCardOrder(orderId, session.metadata?.coupon_id ?? null);
        return { state: 'cancelled', orderNumber };
    }
    return { state: 'pending', orderNumber };
}
