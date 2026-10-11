/**
 * Checkout pricing rules shared by the checkout UI (for display) and
 * createOrder (the source of truth). Keep all money math here so the two
 * can never disagree.
 */

export const FREE_SHIPPING_THRESHOLD = 5000;
export const STANDARD_SHIPPING_COST = 500;
export const EXPRESS_SHIPPING_SURCHARGE = 300;

export type ShippingMethod = 'standard' | 'express';

export interface CouponRule {
    discount_type: string;
    discount_value: number;
    min_order_amount: number | null;
    max_uses: number | null;
    uses_count: number | null;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean | null;
}

/** Round to whole paisa to avoid floating point drift (e.g. 0.1 + 0.2). */
export function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

export function calculateShipping(subtotal: number, method: ShippingMethod): number {
    const base = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
    return base + (method === 'express' ? EXPRESS_SHIPPING_SURCHARGE : 0);
}

/**
 * Returns null when the coupon is usable, otherwise a customer-facing reason.
 * NULL start/end dates mean "no limit".
 */
export function getCouponProblem(coupon: CouponRule, subtotal: number, now = new Date()): string | null {
    if (coupon.is_active === false) return 'Invalid coupon code';
    if (coupon.starts_at && now < new Date(coupon.starts_at)) return 'This coupon is not active yet';
    if (coupon.ends_at && now > new Date(coupon.ends_at)) return 'Coupon has expired';
    if (coupon.max_uses !== null && (coupon.uses_count ?? 0) >= coupon.max_uses) {
        return 'Coupon usage limit reached';
    }
    const minimum = coupon.min_order_amount ?? 0;
    if (subtotal < minimum) return `Minimum order of PKR ${minimum.toLocaleString()} required`;
    return null;
}

export function calculateCouponDiscount(coupon: Pick<CouponRule, 'discount_type' | 'discount_value'>, subtotal: number): number {
    const raw = coupon.discount_type === 'percentage'
        ? (subtotal * coupon.discount_value) / 100
        : coupon.discount_value;
    return roundMoney(Math.min(Math.max(raw, 0), subtotal));
}
