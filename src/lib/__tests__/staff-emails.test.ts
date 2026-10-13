import { getAdminEmail, getSuperAdminEmail, normalizeEmail } from '@/lib/staff-emails';

const env = process.env as Record<string, string | undefined>;
const saved = { ...env };

beforeEach(() => {
    delete env.ADMIN_EMAIL;
    delete env.SUPER_ADMIN_EMAIL;
    delete env['Super-Admin-Email'];
});

afterAll(() => {
    Object.assign(env, saved);
});

describe('normalizeEmail', () => {
    it('trims and lowercases, as Supabase stores emails', () => {
        expect(normalizeEmail('  Owner@ClosetByEra.com \n')).toBe('owner@closetbyera.com');
    });

    it('treats missing and blank values as unset', () => {
        expect(normalizeEmail(undefined)).toBeUndefined();
        expect(normalizeEmail(null)).toBeUndefined();
        expect(normalizeEmail('   ')).toBeUndefined();
    });
});

describe('staff emails from env', () => {
    it('normalizes ADMIN_EMAIL', () => {
        env.ADMIN_EMAIL = ' Admin@ClosetByEra.com';
        expect(getAdminEmail()).toBe('admin@closetbyera.com');
    });

    it('reads SUPER_ADMIN_EMAIL, or the legacy Super-Admin-Email name', () => {
        env['Super-Admin-Email'] = 'Legacy@ClosetByEra.com';
        expect(getSuperAdminEmail()).toBe('legacy@closetbyera.com');

        env.SUPER_ADMIN_EMAIL = 'Owner@ClosetByEra.com ';
        expect(getSuperAdminEmail()).toBe('owner@closetbyera.com');
    });

    it('is unset when the variables are missing or blank', () => {
        expect(getAdminEmail()).toBeUndefined();
        env.SUPER_ADMIN_EMAIL = ' ';
        expect(getSuperAdminEmail()).toBeUndefined();
    });
});
