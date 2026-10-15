import { validateCoupon, createCoupon, getCoupons } from '../coupons';
import { getAdminContext } from '@/lib/auth';

const mockFrom = jest.fn();
const mockAdminSupabase = {
    from: mockFrom,
};

jest.mock('@/lib/supabase/server', () => ({
    createAdminClient: () => mockAdminSupabase,
}));

jest.mock('@/lib/auth', () => ({
    getAdminContext: jest.fn(),
    getSessionUser: jest.fn().mockResolvedValue(null),
    FORBIDDEN: 'Forbidden',
}));

jest.mock('@/lib/rate-limit', () => ({
    checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60 }),
}));

jest.mock('@/lib/request', () => ({
    getClientIp: jest.fn().mockResolvedValue('127.0.0.1'),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('coupons actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateCoupon', () => {
        it('returns error when coupon does not exist', async () => {
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
                    }),
                }),
            });

            const result = await validateCoupon('INVALID_CODE', 1000);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid coupon code');
        });

        it('returns valid coupon data when coupon is found and valid', async () => {
            const mockCoupon = {
                id: 'c-1',
                code: 'DISCOUNT10',
                discount_type: 'percentage',
                discount_value: 10,
                min_order_amount: 500,
                max_uses: 100,
                uses_count: 5,
                starts_at: '2020-01-01T00:00:00Z',
                ends_at: '2030-01-01T00:00:00Z',
                is_active: true,
                created_at: '2020-01-01T00:00:00Z',
            };

            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({ data: mockCoupon }),
                    }),
                }),
            });

            const result = await validateCoupon('DISCOUNT10', 1000);
            expect(result.success).toBe(true);
            expect(result.data?.code).toBe('DISCOUNT10');
        });
    });

    describe('admin coupon management', () => {
        it('requires admin context to getCoupons', async () => {
            (getAdminContext as jest.Mock).mockResolvedValueOnce(null);

            const result = await getCoupons();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Forbidden');
        });

        it('validates discount value on coupon creation', async () => {
            (getAdminContext as jest.Mock).mockResolvedValueOnce({ supabase: mockAdminSupabase });

            const result = await createCoupon({
                code: 'TEST',
                discount_type: 'percentage',
                discount_value: -5,
                min_order_amount: 0,
                max_uses: 10,
                ends_at: null,
                is_active: true,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Value must be positive');
        });
    });
});
