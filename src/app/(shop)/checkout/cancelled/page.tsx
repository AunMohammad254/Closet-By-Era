import { getStripe } from '@/lib/stripe';
import { expireCheckoutSession, sessionBelongsToUser, settleCheckoutSession } from '@/lib/card-payments';
import { getSessionUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import CheckoutResult from '../CheckoutResult';

export const metadata = { title: 'Payment cancelled | Closet By Era' };
export const dynamic = 'force-dynamic';

export default async function CheckoutCancelledPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string }>;
}) {
    const { session_id: sessionId } = await searchParams;
    const stripe = getStripe();
    const viewer = await getSessionUser();

    if (stripe && viewer && sessionId?.startsWith('cs_')) {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (!(await sessionBelongsToUser(session, viewer.user.id))) throw new Error('Session belongs to another user');

            // Close the session now instead of holding stock for 30 minutes.
            // Settling an expired session cancels the order and returns its
            // stock and discounts (and does nothing if it was actually paid).
            await expireCheckoutSession(sessionId);
            const result = await settleCheckoutSession(await stripe.checkout.sessions.retrieve(sessionId));
            if (result.state === 'paid') {
                return (
                    <CheckoutResult
                        tone="success"
                        title="Payment received"
                        message="This order was already paid, so it has not been cancelled."
                        orderNumber={result.orderNumber}
                        primary={{ href: '/account?tab=orders', label: 'View Orders' }}
                    />
                );
            }
        } catch (error) {
            logger.warn('Could not cancel checkout session', { sessionId, reason: (error as Error).message });
        }
    }

    return (
        <CheckoutResult
            tone="neutral"
            title="Payment cancelled"
            message="No payment was taken and the order was cancelled. Your cart is still saved, so you can try again or choose another payment method."
            primary={{ href: '/checkout', label: 'Back to checkout' }}
            secondary={{ href: '/cart', label: 'View cart' }}
        />
    );
}
