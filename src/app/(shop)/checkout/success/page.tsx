import { getStripe } from '@/lib/stripe';
import { settleCheckoutSession, type SettleResult } from '@/lib/card-payments';
import { logger } from '@/lib/logger';
import CheckoutResult from '../CheckoutResult';
import ClearCartOnMount from '../ClearCartOnMount';

export const metadata = { title: 'Payment received | Closet By Era' };
export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string }>;
}) {
    const { session_id: sessionId } = await searchParams;
    const stripe = getStripe();
    let result: SettleResult = { state: 'unknown' };

    if (stripe && sessionId?.startsWith('cs_')) {
        try {
            // The webhook is the main path; settling here as well means the
            // customer sees the final state even if the webhook is late.
            result = await settleCheckoutSession(await stripe.checkout.sessions.retrieve(sessionId));
        } catch (error) {
            logger.warn('Could not load checkout session', { sessionId, reason: (error as Error).message });
        }
    }

    if (result.state === 'paid') {
        return (
            <CheckoutResult
                tone="success"
                title="Payment received"
                message="Thank you! Your card payment went through and your order is confirmed. A confirmation email is on its way."
                orderNumber={result.orderNumber}
                primary={{ href: '/products', label: 'Continue Shopping' }}
                secondary={{ href: '/account?tab=orders', label: 'View Orders' }}
            >
                <ClearCartOnMount />
            </CheckoutResult>
        );
    }

    if (result.state === 'pending') {
        return (
            <CheckoutResult
                tone="pending"
                title="Payment processing"
                message="Your bank is still confirming the payment. We will email you as soon as it clears."
                orderNumber={result.orderNumber}
                primary={{ href: '/account?tab=orders', label: 'View Orders' }}
            >
                <ClearCartOnMount />
            </CheckoutResult>
        );
    }

    return (
        <CheckoutResult
            tone="neutral"
            title={result.state === 'cancelled' ? 'Payment expired' : 'Payment not found'}
            message="We could not confirm a payment for this checkout. You have not been charged; your cart is still saved."
            orderNumber={result.state === 'cancelled' ? result.orderNumber : undefined}
            primary={{ href: '/checkout', label: 'Back to checkout' }}
            secondary={{ href: '/cart', label: 'View cart' }}
        />
    );
}
