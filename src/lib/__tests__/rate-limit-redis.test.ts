/**
 * @jest-environment node
 *
 * The Upstash (production) path of checkRateLimit, against a mocked REST API.
 */
import { checkRateLimit, getRedisConfig } from '@/lib/rate-limit';

const env = process.env as Record<string, string | undefined>;
const saved = { ...env };

type Reply = { result?: number | string | null; error?: string };
const fetchMock = jest.fn();

/** Answers each pipeline call with the given replies, in order. */
function upstashReplies(...calls: Reply[][]) {
    for (const replies of calls) {
        fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => replies });
    }
}

let n = 0;
const uniqueId = () => `user-${++n}-${Date.now()}`;

beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    env.NODE_ENV = 'production';
    delete env.UPSTASH_REDIS_REST_URL;
    delete env.UPSTASH_REDIS_REST_TOKEN;
    delete env.KV_REST_API_URL;
    delete env.KV_REST_API_TOKEN;
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    Object.assign(env, saved);
});

describe('getRedisConfig', () => {
    it('reads the Upstash names', () => {
        env.UPSTASH_REDIS_REST_URL = 'https://a.upstash.io/';
        env.UPSTASH_REDIS_REST_TOKEN = 't1';
        expect(getRedisConfig()).toEqual({ url: 'https://a.upstash.io', token: 't1' });
    });

    it('reads the names the Vercel Marketplace integration sets', () => {
        env.KV_REST_API_URL = 'https://b.upstash.io';
        env.KV_REST_API_TOKEN = 't2';
        expect(getRedisConfig()).toEqual({ url: 'https://b.upstash.io', token: 't2' });
    });

    it('is off without both values', () => {
        env.KV_REST_API_URL = 'https://b.upstash.io';
        expect(getRedisConfig()).toBeNull();
    });
});

describe('checkRateLimit with Upstash', () => {
    beforeEach(() => {
        env.KV_REST_API_URL = 'https://b.upstash.io';
        env.KV_REST_API_TOKEN = 'secret-token';
    });

    it('counts in one pipeline call that sets the window expiry', async () => {
        upstashReplies([{ result: 'OK' }, { result: 1 }, { result: 60 }]);
        const result = await checkRateLimit(uniqueId(), 'test', { limit: 3, windowSeconds: 60 });

        expect(result).toEqual({ allowed: true, remaining: 2, resetIn: 60 });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://b.upstash.io/pipeline');
        expect(init.headers.Authorization).toBe('Bearer secret-token');
        const commands = JSON.parse(init.body);
        expect(commands[0]).toEqual(['SET', expect.stringMatching(/^ratelimit:test:/), '0', 'EX', '60', 'NX']);
        expect(commands[1][0]).toBe('INCR');
    });

    it('blocks once the limit is passed', async () => {
        upstashReplies([{ result: null }, { result: 4 }, { result: 42 }]);
        const result = await checkRateLimit(uniqueId(), 'test', { limit: 3, windowSeconds: 60 });
        expect(result).toEqual({ allowed: false, remaining: 0, resetIn: 42 });
    });

    it('gives a counter without an expiry one', async () => {
        upstashReplies([{ result: null }, { result: 2 }, { result: -1 }], [{ result: 1 }]);
        const result = await checkRateLimit(uniqueId(), 'test', { limit: 3, windowSeconds: 30 });

        expect(result.resetIn).toBe(30);
        expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual([['EXPIRE', expect.any(String), '30']]);
    });

    it('falls back to counting in memory when Upstash refuses the token', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'WRONGPASS' }) });
        const id = uniqueId();
        const config = { limit: 2, windowSeconds: 60 };

        expect((await checkRateLimit(id, 'test', config)).allowed).toBe(true);
        expect((await checkRateLimit(id, 'test', config)).allowed).toBe(true);
        // Still limited: a broken Redis must not switch rate limiting off.
        expect((await checkRateLimit(id, 'test', config)).allowed).toBe(false);
    });

    it('falls back to memory when a command errors', async () => {
        upstashReplies([{ result: null }, { error: 'ERR max requests limit exceeded' }, { result: 10 }]);
        const result = await checkRateLimit(uniqueId(), 'test', { limit: 3, windowSeconds: 60 });
        expect(result).toEqual({ allowed: true, remaining: 2, resetIn: 60 });
    });

    it('is not used outside production', async () => {
        env.NODE_ENV = 'development';
        await checkRateLimit(uniqueId(), 'test', { limit: 3, windowSeconds: 60 });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
