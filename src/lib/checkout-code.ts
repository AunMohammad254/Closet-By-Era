/**
 * A coupon / gift card code entered in the cart, carried to the checkout page
 * (which validates it again and applies it). Session storage only.
 */
const KEY = 'checkout_code';

export function saveCheckoutCode(code: string): void {
    try {
        sessionStorage.setItem(KEY, code);
    } catch {
        // Storage unavailable (private mode): the shopper can re-enter it at checkout.
    }
}

export function takeCheckoutCode(): string | null {
    try {
        const code = sessionStorage.getItem(KEY);
        sessionStorage.removeItem(KEY);
        return code;
    } catch {
        return null;
    }
}
