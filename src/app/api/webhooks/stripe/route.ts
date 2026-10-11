import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { cancelUnpaidCardOrder, settleCheckoutSession } from '@/lib/card-payments';
import { logger } from '@/lib/logger';

/**
 * Stripe webhook. Dashboard (test mode): Developers > Webhooks > Add endpoint
 * https://<site>/api/webhooks/stripe with the events below; put its signing
 * secret in STRIPE_WEBHOOK_SECRET. Locally: `stripe listen --forward-to
 * localhost:3000/api/webhooks/stripe`.
 *
 * Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, checkout.session.expired
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    // The signature covers the raw body, so read it as text, not JSON.
    const body = await request.text();
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, request.headers.get('stripe-signature') ?? '', secret);
    } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded':
            case 'checkout.session.expired':
                await settleCheckoutSession(event.data.object);
                break;
            case 'checkout.session.async_payment_failed': {
                const session = event.data.object;
                if (session.metadata?.order_id) {
                    await cancelUnpaidCardOrder(session.metadata.order_id, session.metadata.coupon_id ?? null);
                }
                break;
            }
        }
    } catch (error) {
        // 500 makes Stripe retry later; handlers are idempotent.
        logger.error('Stripe webhook handling failed', error, { type: event.type, id: event.id });
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
