import { createReturn, getReturns } from '../returns';
import { getAdminContext, getSessionUser } from '@/lib/auth';

const mockFrom = jest.fn();
const mockSupabase = {
    from: mockFrom,
};

jest.mock('@/lib/auth', () => ({
    getAdminContext: jest.fn(),
    getSessionUser: jest.fn(),
    FORBIDDEN: 'Forbidden',
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('returns actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createReturn', () => {
        it('requires customer to be signed in', async () => {
            (getSessionUser as jest.Mock).mockResolvedValueOnce(null);

            const result = await createReturn({ order_id: 'order-1', reason: 'Defective item' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Please sign in');
        });

        it('validates return reason length', async () => {
            (getSessionUser as jest.Mock).mockResolvedValueOnce({
                user: { id: 'auth-user-1' },
                supabase: mockSupabase,
            });

            const result = await createReturn({ order_id: 'order-1', reason: '' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Please describe the reason');
        });

        it('successfully submits return request for valid order', async () => {
            (getSessionUser as jest.Mock).mockResolvedValueOnce({
                user: { id: 'auth-user-1' },
                supabase: mockSupabase,
            });

            // Mock customer profile lookup, order lookup, and insert
            mockFrom
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'cust-1' } }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'order-1' } }),
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    insert: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: { id: 'ret-123' }, error: null }),
                        }),
                    }),
                });

            const result = await createReturn({ order_id: 'order-1', reason: 'Wrong size delivered' });
            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('ret-123');
        });
    });

    describe('getReturns', () => {
        it('requires admin permissions', async () => {
            (getAdminContext as jest.Mock).mockResolvedValueOnce(null);

            const result = await getReturns();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Forbidden');
        });
    });
});
