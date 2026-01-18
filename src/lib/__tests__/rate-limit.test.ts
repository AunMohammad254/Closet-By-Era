/**
 * Unit tests for rate limiting functionality
 */
import { checkRateLimitSync, RateLimits } from '@/lib/rate-limit';

describe('Rate Limiter', () => {
    describe('checkRateLimitSync', () => {
        it('should allow first request', () => {
            const result = checkRateLimitSync('test-user-1', 'test-action', { limit: 5, windowSeconds: 60 });

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
            expect(result.resetIn).toBeGreaterThan(0);
        });

        it('should decrement remaining count on subsequent requests', () => {
            const identifier = 'test-user-decrement';
            const config = { limit: 5, windowSeconds: 60 };

            checkRateLimitSync(identifier, 'test-action', config);
            const result = checkRateLimitSync(identifier, 'test-action', config);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(3);
        });

        it('should block requests when limit is exceeded', () => {
            const identifier = 'test-user-block';
            const config = { limit: 2, windowSeconds: 60 };

            checkRateLimitSync(identifier, 'block-action', config);
            checkRateLimitSync(identifier, 'block-action', config);
            const result = checkRateLimitSync(identifier, 'block-action', config);

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should track different actions separately', () => {
            const identifier = 'test-user-actions';
            const config = { limit: 2, windowSeconds: 60 };

            checkRateLimitSync(identifier, 'action-a', config);
            checkRateLimitSync(identifier, 'action-a', config);

            // Different action should have its own counter
            const resultB = checkRateLimitSync(identifier, 'action-b', config);
            expect(resultB.allowed).toBe(true);
            expect(resultB.remaining).toBe(1);
        });
    });

    describe('RateLimits presets', () => {
        it('should have correct preset values', () => {
            expect(RateLimits.mutation.limit).toBe(30);
            expect(RateLimits.auth.limit).toBe(5);
            expect(RateLimits.sensitive.limit).toBe(3);
            expect(RateLimits.read.limit).toBe(100);
            expect(RateLimits.api.limit).toBe(60);
        });

        it('should have windowSeconds defined', () => {
            expect(RateLimits.mutation.windowSeconds).toBe(60);
            expect(RateLimits.auth.windowSeconds).toBe(300);
        });
    });
});
