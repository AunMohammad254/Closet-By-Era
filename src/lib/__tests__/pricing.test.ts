import {
    roundMoney,
    calculateShipping,
    getCouponProblem,
    calculateCouponDiscount,
    FREE_SHIPPING_THRESHOLD,
    STANDARD_SHIPPING_COST,
    EXPRESS_SHIPPING_SURCHARGE,
    type CouponRule,
} from '../pricing';

describe('pricing rules', () => {
    describe('roundMoney', () => {
        it('rounds floating numbers to two decimal places', () => {
            expect(roundMoney(10.123)).toBe(10.12);
            expect(roundMoney(10.128)).toBe(10.13);
            expect(roundMoney(0.1 + 0.2)).toBe(0.3);
        });
    });

    describe('calculateShipping', () => {
        it('charges standard shipping for orders below free shipping threshold', () => {
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD - 1, 'standard')).toBe(STANDARD_SHIPPING_COST);
        });

        it('gives free shipping on standard method when subtotal >= threshold', () => {
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD, 'standard')).toBe(0);
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD + 1000, 'standard')).toBe(0);
        });

        it('adds express surcharge regardless of threshold', () => {
            expect(calculateShipping(2000, 'express')).toBe(STANDARD_SHIPPING_COST + EXPRESS_SHIPPING_SURCHARGE);
            expect(calculateShipping(10000, 'express')).toBe(EXPRESS_SHIPPING_SURCHARGE);
        });
    });

    describe('getCouponProblem', () => {
        const baseCoupon: CouponRule = {
            discount_type: 'percentage',
            discount_value: 10,
            min_order_amount: 1000,
            max_uses: 10,
            uses_count: 2,
            starts_at: '2026-01-01T00:00:00Z',
            ends_at: '2026-12-31T23:59:59Z',
            is_active: true,
        };

        const now = new Date('2026-06-01T00:00:00Z');

        it('returns null when coupon is valid and usable', () => {
            expect(getCouponProblem(baseCoupon, 1500, now)).toBeNull();
        });

        it('returns problem when is_active is false', () => {
            expect(getCouponProblem({ ...baseCoupon, is_active: false }, 1500, now)).toBe('Invalid coupon code');
        });

        it('returns problem when not active yet', () => {
            const early = new Date('2025-12-31T00:00:00Z');
            expect(getCouponProblem(baseCoupon, 1500, early)).toBe('This coupon is not active yet');
        });

        it('returns problem when expired', () => {
            const late = new Date('2027-01-01T00:00:00Z');
            expect(getCouponProblem(baseCoupon, 1500, late)).toBe('Coupon has expired');
        });

        it('returns problem when usage limit is reached', () => {
            expect(getCouponProblem({ ...baseCoupon, uses_count: 10, max_uses: 10 }, 1500, now)).toBe('Coupon usage limit reached');
        });

        it('returns problem when minimum order amount is not met', () => {
            expect(getCouponProblem(baseCoupon, 500, now)).toBe('Minimum order of PKR 1,000 required');
        });
    });

    describe('calculateCouponDiscount', () => {
        it('calculates percentage discount accurately', () => {
            expect(calculateCouponDiscount({ discount_type: 'percentage', discount_value: 15 }, 2000)).toBe(300);
        });

        it('calculates fixed discount', () => {
            expect(calculateCouponDiscount({ discount_type: 'fixed', discount_value: 500 }, 2000)).toBe(500);
        });

        it('caps discount at subtotal so total is never negative', () => {
            expect(calculateCouponDiscount({ discount_type: 'fixed', discount_value: 5000 }, 2000)).toBe(2000);
        });
    });
});
