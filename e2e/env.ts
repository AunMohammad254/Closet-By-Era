/**
 * Everything the end-to-end suite needs to know about its environment.
 *
 * The app under test is a production build pointed at the LOCAL Supabase stack
 * (e2e/supabase, `bun run e2e:db:start`) with email captured by MailDev. Nothing
 * here can reach the hosted project: every variable the app reads from .env is
 * overridden below.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const ROOT = path.resolve(__dirname, '..');
export const APP_PORT = 3123;
export const BASE_URL = `http://localhost:${APP_PORT}`;

export const MAILDEV = { smtpPort: 1025, webPort: 1080, url: 'http://127.0.0.1:1080' };

// Fixed TEST secrets. They must match e2e/supabase/config.toml; they protect nothing real.
export const SEND_EMAIL_HOOK_SECRET = 'v1,whsec_Y2xvc2V0LWJ5LWVyYS1lMmUtaG9vay1zZWNyZXQ=';
export const STRIPE_WEBHOOK_SECRET = 'whsec_closet_by_era_e2e_webhook_secret';
// A syntactically valid test key: card checkout is offered, and Stripe rejects
// it, which exercises the "card payment unavailable" path. A real test key can
// be supplied with E2E_STRIPE_SECRET_KEY to run the full card flow.
export const STRIPE_SECRET_KEY = process.env.E2E_STRIPE_SECRET_KEY || 'sk_test_closet_by_era_e2e_invalid_key';

export const PASSWORD = 'E2e-Passw0rd!';

export const USERS = {
    customer: { email: 'customer@closetbyera.test', firstName: 'Ayesha', lastName: 'Khan', role: 'customer' },
    admin: { email: 'admin@closetbyera.test', firstName: 'Admin', lastName: 'User', role: 'admin' },
    superAdmin: { email: 'superadmin@closetbyera.test', firstName: 'Super', lastName: 'Admin', role: 'super_admin' },
} as const;

export type Role = keyof typeof USERS;

export const STORAGE_STATE = (role: Role) => path.join(ROOT, 'e2e', '.auth', `${role}.json`);

interface SupabaseStatus {
    API_URL: string;
    DB_URL: string;
    ANON_KEY: string;
    SERVICE_ROLE_KEY: string;
}

let cachedStatus: SupabaseStatus | null = null;

/**
 * Connection details of the local stack: from E2E_SUPABASE_* (set by CI), or
 * from `supabase status` when running locally.
 */
export function supabaseStatus(): SupabaseStatus {
    if (cachedStatus) return cachedStatus;
    const env = process.env;
    if (env.E2E_SUPABASE_URL && env.E2E_SUPABASE_ANON_KEY && env.E2E_SUPABASE_SERVICE_ROLE_KEY) {
        cachedStatus = {
            API_URL: env.E2E_SUPABASE_URL,
            DB_URL: env.E2E_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
            ANON_KEY: env.E2E_SUPABASE_ANON_KEY,
            SERVICE_ROLE_KEY: env.E2E_SUPABASE_SERVICE_ROLE_KEY,
        };
        return cachedStatus;
    }

    const bin = path.join(ROOT, 'node_modules', 'supabase', 'bin', process.platform === 'win32' ? 'supabase.exe' : 'supabase');
    try {
        const out = execFileSync(bin, ['status', '-o', 'json', '--workdir', 'e2e'], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
        const json = JSON.parse(out.slice(out.indexOf('{')));
        cachedStatus = { API_URL: json.API_URL, DB_URL: json.DB_URL, ANON_KEY: json.ANON_KEY, SERVICE_ROLE_KEY: json.SERVICE_ROLE_KEY };
        return cachedStatus;
    } catch {
        throw new Error(
            'The local Supabase test stack is not running. Start it with `bun run e2e:db:start` ' +
            '(needs Docker), or set E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY and E2E_SUPABASE_SERVICE_ROLE_KEY.'
        );
    }
}

/** Environment for the app under test (build and start). */
export function appEnv(): Record<string, string> {
    const sb = supabaseStatus();
    return {
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_DIST_DIR: '.next-e2e',
        E2E_ALLOW_LOCAL_IMAGES: '1',

        NEXT_PUBLIC_SUPABASE_URL: sb.API_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: sb.ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: sb.SERVICE_ROLE_KEY,
        NEXT_PUBLIC_SITE_URL: BASE_URL,
        NEXT_PUBLIC_WHATSAPP_NUMBER: '923000000000',

        ADMIN_EMAIL: USERS.admin.email,
        ADMIN_PASSWORD: PASSWORD,
        SUPER_ADMIN_EMAIL: USERS.superAdmin.email,
        'Super-Admin-Email': USERS.superAdmin.email,

        // All email goes to MailDev.
        EMAIL_PROVIDERS: 'smtp',
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: String(MAILDEV.smtpPort),
        SMTP_SECURE: 'false',
        SMTP_USER: 'e2e',
        SMTP_PASSWORD: 'e2e',
        EMAIL_FROM: 'orders@closetbyera.test',
        EMAIL_FROM_NAME: 'Closet By Era',
        SMTP_FROM_EMAIL: 'orders@closetbyera.test',
        SMTP_FROM_NAME: 'Closet By Era',
        BREVO_SMTP_LOGIN: '',
        BREVO_SMTP_KEY: '',
        RESEND_API_KEY: '',
        SEND_EMAIL_HOOK_SECRET,

        STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET,
        STRIPE_ALLOW_LIVE: '',

        // Never touch real services from tests.
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
        OPENAI_API_KEY: '',
        GemeniAPIKey: '',
        API_KEY: '',
    };
}
