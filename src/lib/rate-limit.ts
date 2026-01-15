/**
 * Simple in-memory rate limiter for server actions
 * For production, use Redis-based solution
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    /** Maximum requests allowed in window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    limit: 10,
    windowSeconds: 60,
};

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (userId or IP)
 * @param action - Action name for more granular limiting
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    action: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetIn: number } {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
        cleanupExpiredEntries();
    }

    if (!entry || now > entry.resetTime) {
        // First request or window expired
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowSeconds * 1000,
        });
        return {
            allowed: true,
            remaining: config.limit - 1,
            resetIn: config.windowSeconds,
        };
    }

    if (entry.count >= config.limit) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((entry.resetTime - now) / 1000),
        };
    }

    // Increment count
    entry.count++;
    return {
        allowed: true,
        remaining: config.limit - entry.count,
        resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
}

/**
 * Cleanup expired entries from the store
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Preset rate limit configurations for different action types
 */
export const RateLimits = {
    /** For mutations like create/update/delete */
    mutation: { limit: 30, windowSeconds: 60 },
    /** For auth actions */
    auth: { limit: 5, windowSeconds: 300 },
    /** For sensitive operations */
    sensitive: { limit: 3, windowSeconds: 60 },
    /** For read operations (more lenient) */
    read: { limit: 100, windowSeconds: 60 },
} as const;
