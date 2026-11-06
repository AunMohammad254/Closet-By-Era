import {
    roundMoney,
    calculateShipping,
    getCouponProblem,
    calculateCouponDiscount,
    CouponRule,
    FREE_SHIPPING_THRESHOLD,
    STANDARD_SHIPPING_COST,
    EXPRESS_SHIPPING_SURCHARGE
} from '../pricing';

describe('Pricing Library', () => {
    describe('roundMoney', () => {
        it('should correctly round numbers to 2 decimal places', () => {
            expect(roundMoney(10.123)).toBe(10.12);
            expect(roundMoney(10.125)).toBe(10.13);
            expect(roundMoney(10.124)).toBe(10.12);
        });

        it('should handle floating point drift correctly', () => {
            expect(roundMoney(0.1 + 0.2)).toBe(0.30);
            expect(roundMoney(1.005)).toBe(1.01);
        });

        it('should handle whole numbers correctly', () => {
            expect(roundMoney(10)).toBe(10.00);
            expect(roundMoney(0)).toBe(0.00);
        });
    });

    describe('calculateShipping', () => {
        it('should charge standard shipping if subtotal is below the free shipping threshold', () => {
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD - 1, 'standard')).toBe(STANDARD_SHIPPING_COST);
        });

        it('should charge express shipping (standard + surcharge) if subtotal is below the threshold', () => {
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD - 1, 'express')).toBe(STANDARD_SHIPPING_COST + EXPRESS_SHIPPING_SURCHARGE);
        });

        it('should give free standard shipping if subtotal is at or above the threshold', () => {
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD, 'standard')).toBe(0);
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD + 1000, 'standard')).toBe(0);
        });

        it('should charge only express surcharge if subtotal is at or above the threshold and express is selected', () => {
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD, 'express')).toBe(EXPRESS_SHIPPING_SURCHARGE);
            expect(calculateShipping(FREE_SHIPPING_THRESHOLD + 1000, 'express')).toBe(EXPRESS_SHIPPING_SURCHARGE);
        });
    });

    describe('getCouponProblem', () => {
        const createValidCoupon = (): CouponRule => ({
            discount_type: 'fixed',
            discount_value: 100,
            min_order_amount: null,
            max_uses: null,
            uses_count: null,
            starts_at: null,
            ends_at: null,
            is_active: true,
        });

        it('should return null for a perfectly valid coupon', () => {
            expect(getCouponProblem(createValidCoupon(), 1000)).toBeNull();
        });

        it('should return error if coupon is explicitly marked as inactive', () => {
            const coupon = { ...createValidCoupon(), is_active: false };
            expect(getCouponProblem(coupon, 1000)).toBe('Invalid coupon code');
        });

        it('should handle null is_active as not explicitly inactive (valid)', () => {
            const coupon = { ...createValidCoupon(), is_active: null };
            expect(getCouponProblem(coupon, 1000)).toBeNull();
        });

        it('should return error if starts_at is in the future', () => {
            const coupon = { ...createValidCoupon(), starts_at: '2050-01-01T00:00:00Z' };
            const now = new Date('2023-01-01T00:00:00Z');
            expect(getCouponProblem(coupon, 1000, now)).toBe('This coupon is not active yet');
        });

        it('should be valid if starts_at is exactly now or in the past', () => {
            const coupon = { ...createValidCoupon(), starts_at: '2023-01-01T00:00:00Z' };
            const now = new Date('2023-01-01T00:00:00Z');
            const pastNow = new Date('2023-01-02T00:00:00Z');
            expect(getCouponProblem(coupon, 1000, now)).toBeNull();
            expect(getCouponProblem(coupon, 1000, pastNow)).toBeNull();
        });

        it('should return error if ends_at is in the past', () => {
            const coupon = { ...createValidCoupon(), ends_at: '2022-01-01T00:00:00Z' };
            const now = new Date('2023-01-01T00:00:00Z');
            expect(getCouponProblem(coupon, 1000, now)).toBe('Coupon has expired');
        });

        it('should be valid if ends_at is exactly now or in the future', () => {
            const coupon = { ...createValidCoupon(), ends_at: '2023-01-01T00:00:00Z' };
            const now = new Date('2023-01-01T00:00:00Z');
            const pastNow = new Date('2022-12-31T00:00:00Z');
            expect(getCouponProblem(coupon, 1000, now)).toBeNull();
            expect(getCouponProblem(coupon, 1000, pastNow)).toBeNull();
        });

        it('should return error if max_uses is reached', () => {
            const coupon = { ...createValidCoupon(), max_uses: 10, uses_count: 10 };
            expect(getCouponProblem(coupon, 1000)).toBe('Coupon usage limit reached');
        });

        it('should return error if max_uses is exceeded', () => {
            const coupon = { ...createValidCoupon(), max_uses: 10, uses_count: 11 };
            expect(getCouponProblem(coupon, 1000)).toBe('Coupon usage limit reached');
        });

        it('should handle missing uses_count as 0', () => {
            const coupon = { ...createValidCoupon(), max_uses: 10, uses_count: null };
            expect(getCouponProblem(coupon, 1000)).toBeNull();
        });

        it('should return error if subtotal is below min_order_amount', () => {
            const coupon = { ...createValidCoupon(), min_order_amount: 5000 };
            expect(getCouponProblem(coupon, 4999)).toBe('Minimum order of PKR 5,000 required');
        });

        it('should be valid if subtotal equals or exceeds min_order_amount', () => {
            const coupon = { ...createValidCoupon(), min_order_amount: 5000 };
            expect(getCouponProblem(coupon, 5000)).toBeNull();
            expect(getCouponProblem(coupon, 6000)).toBeNull();
        });
    });

    describe('calculateCouponDiscount', () => {
        it('should calculate percentage discount correctly', () => {
            const coupon = { discount_type: 'percentage', discount_value: 10 };
            expect(calculateCouponDiscount(coupon, 1000)).toBe(100);
        });

        it('should handle decimal percentages properly', () => {
            const coupon = { discount_type: 'percentage', discount_value: 12.5 };
            expect(calculateCouponDiscount(coupon, 1000)).toBe(125);
        });

        it('should calculate fixed discount correctly', () => {
            const coupon = { discount_type: 'fixed', discount_value: 500 };
            expect(calculateCouponDiscount(coupon, 1000)).toBe(500);
        });

        it('should not allow discount to be negative (min limit)', () => {
            const coupon = { discount_type: 'fixed', discount_value: -100 };
            expect(calculateCouponDiscount(coupon, 1000)).toBe(0);

            const couponPct = { discount_type: 'percentage', discount_value: -10 };
            expect(calculateCouponDiscount(couponPct, 1000)).toBe(0);
        });

        it('should cap the discount to the subtotal amount (max limit)', () => {
            const coupon = { discount_type: 'fixed', discount_value: 1500 };
            expect(calculateCouponDiscount(coupon, 1000)).toBe(1000);

            const couponPct = { discount_type: 'percentage', discount_value: 150 };
            expect(calculateCouponDiscount(couponPct, 1000)).toBe(1000);
        });

        it('should round the discount appropriately', () => {
            const coupon = { discount_type: 'percentage', discount_value: 33.33 };
            expect(calculateCouponDiscount(coupon, 100)).toBe(33.33);
        });
    });
});
