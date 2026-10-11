import { getCheckoutPaymentOptions } from '@/lib/store-settings';
import CheckoutForm from './CheckoutForm';

export const metadata = {
    title: 'Checkout | Closet By Era',
};

// Payment options come from Admin > Settings and must never be stale.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
    const paymentOptions = await getCheckoutPaymentOptions();
    return <CheckoutForm paymentOptions={paymentOptions} />;
}
