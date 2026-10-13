/**
 * Production-ready rate limiter with Redis support via Upstash
 * Falls back to in-memory for development when Redis is not configured
 * 
 * To enable Redis rate limiting, either:
 * - Vercel > Storage > Upstash for Redis, connected to the project (sets KV_REST_API_URL / KV_REST_API_TOKEN), or
 * - an Upstash database from https://console.upstash.com with UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN set.
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

interface UpstashReply {
    result?: number | string | null;
    error?: string;
}

/** Give up on Redis after this long and count in memory instead. */
const REDIS_TIMEOUT_MS = 1500;

/**
 * Upstash REST credentials: added by hand (UPSTASH_REDIS_REST_*) or by the
 * Vercel Marketplace integration (KV_REST_API_*).
 */
export function getRedisConfig(): { url: string; token: string } | null {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

async function upstash(redis: { url: string; token: string }, commands: (string | number)[][]): Promise<UpstashReply[]> {
    const res = await fetch(`${redis.url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${redis.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
    return res.json();
}

async function checkRedisRateLimit(
    key: string,
    config: RateLimitConfig,
    redis: { url: string; token: string }
): Promise<RateLimitResult> {
    const redisKey = `ratelimit:${key}`;
    const window = String(config.windowSeconds);

    try {
        // One round trip: open the window with its expiry if it is new, count, read the TTL.
        const [, incr, ttl] = await upstash(redis, [
            ['SET', redisKey, '0', 'EX', window, 'NX'],
            ['INCR', redisKey],
            ['TTL', redisKey],
        ]);
        if (typeof incr?.result !== 'number') {
            throw new Error(incr?.error ?? 'Unexpected Upstash reply');
        }

        let resetIn = typeof ttl?.result === 'number' ? ttl.result : config.windowSeconds;
        if (resetIn < 0) {
            // A counter without an expiry would block this key forever; give it one.
            await upstash(redis, [['EXPIRE', redisKey, window]]);
            resetIn = config.windowSeconds;
        }

        const count = incr.result;
        return {
            allowed: count <= config.limit,
            remaining: Math.max(0, config.limit - count),
            resetIn,
        };
    } catch (error) {
        // Never fail open silently: count in memory until Redis answers again.
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
    const redis = process.env.NODE_ENV === 'production' ? getRedisConfig() : null;
    if (redis) {
        return checkRedisRateLimit(key, config, redis);
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
