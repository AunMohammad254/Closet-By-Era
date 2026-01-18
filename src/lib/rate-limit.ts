/**
 * Production-ready rate limiter with Redis support via Upstash
 * Falls back to in-memory for development when Redis is not configured
 * 
 * To enable Redis rate limiting:
 * 1. Create an Upstash Redis database at https://upstash.com
 * 2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to env
 */

// ============================================================================
// Types
// ============================================================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitConfig {
    /** Maximum requests allowed in window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

// ============================================================================
// In-Memory Store (Development Fallback)
// ============================================================================

const memoryStore = new Map<string, RateLimitEntry>();

function checkMemoryRateLimit(
    key: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const entry = memoryStore.get(key);

    // Clean up expired entries periodically
    if (memoryStore.size > 10000) {
        for (const [k, e] of memoryStore.entries()) {
            if (now > e.resetTime) memoryStore.delete(k);
        }
    }

    if (!entry || now > entry.resetTime) {
        memoryStore.set(key, {
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
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((entry.resetTime - now) / 1000),
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: config.limit - entry.count,
        resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
}

// ============================================================================
// Redis Store (Production)
// ============================================================================

interface UpstashResponse {
    result: number | null;
}

async function checkRedisRateLimit(
    key: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
    const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!REDIS_URL || !REDIS_TOKEN) {
        // Fallback to memory if Redis not configured
        return checkMemoryRateLimit(key, config);
    }

    try {
        // Use Upstash Redis REST API with INCR + EXPIRE pattern
        const redisKey = `ratelimit:${key}`;

        // INCR the counter
        const incrResponse = await fetch(`${REDIS_URL}/incr/${redisKey}`, {
            headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
        });
        const incrData: UpstashResponse = await incrResponse.json();
        const count = incrData.result ?? 1;

        // Set expiry if this is the first request in the window
        if (count === 1) {
            await fetch(`${REDIS_URL}/expire/${redisKey}/${config.windowSeconds}`, {
                headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
            });
        }

        // Get TTL for remaining time
        const ttlResponse = await fetch(`${REDIS_URL}/ttl/${redisKey}`, {
            headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
        });
        const ttlData: UpstashResponse = await ttlResponse.json();
        const ttl = ttlData.result ?? config.windowSeconds;

        const allowed = count <= config.limit;
        return {
            allowed,
            remaining: Math.max(0, config.limit - count),
            resetIn: Math.max(0, ttl),
        };
    } catch (error) {
        console.error('[RateLimit] Redis error, falling back to memory:', error);
        return checkMemoryRateLimit(key, config);
    }
}

// ============================================================================
// Public API
// ============================================================================

const DEFAULT_CONFIG: RateLimitConfig = {
    limit: 10,
    windowSeconds: 60,
};

/**
 * Check if a request should be rate limited
 * Uses Redis in production (if configured), falls back to in-memory
 * 
 * @param identifier - Unique identifier (userId or IP)
 * @param action - Action name for more granular limiting
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
    identifier: string,
    action: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
    const key = `${action}:${identifier}`;

    // Use Redis in production, memory in development
    if (process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL) {
        return checkRedisRateLimit(key, config);
    }

    return checkMemoryRateLimit(key, config);
}

/**
 * Synchronous check for backward compatibility (memory-only)
 * @deprecated Use async checkRateLimit() instead
 */
export function checkRateLimitSync(
    identifier: string,
    action: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
    const key = `${action}:${identifier}`;
    return checkMemoryRateLimit(key, config);
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
    /** For API endpoints */
    api: { limit: 60, windowSeconds: 60 },
} as const;
