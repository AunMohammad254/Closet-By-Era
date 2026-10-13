import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from '@/context/AuthContext';

type Listener = (event: string, session: { user: User } | null) => void;

let mockListener: Listener | undefined;
const mockGetSession = jest.fn();

jest.mock('@/lib/supabase/client', () => {
    const client = {
        auth: {
            getSession: () => mockGetSession(),
            onAuthStateChange: (callback: Listener) => {
                mockListener = callback;
                return { data: { subscription: { unsubscribe: jest.fn() } } };
            },
        },
    };
    // A singleton, like the real browser client.
    return { createClient: () => client };
});

/** A fresh object every call, like Supabase hands out on each auth event. */
const shopper = (overrides: Partial<User> = {}) =>
    ({ id: 'user-1', email: 'shopper@example.com', updated_at: '2026-01-01T00:00:00Z', ...overrides }) as User;

/** Records each new `user` object consumers are given. */
function renderAuth() {
    const users: (User | null)[] = [];
    function Probe() {
        const { user } = useAuth();
        useEffect(() => { users.push(user); }, [user]);
        return null;
    }
    render(<AuthProvider><Probe /></AuthProvider>);
    return users;
}

const emit = (event: string, user: User | null) =>
    act(async () => { mockListener?.(event, user ? { user } : null); });

beforeEach(() => {
    mockListener = undefined;
    mockGetSession.mockResolvedValue({ data: { session: { user: shopper() } } });
});

describe('AuthProvider', () => {
    it('keeps the same user object when Supabase re-announces an unchanged user', async () => {
        const users = renderAuth();
        await act(async () => {});
        expect(users.map(u => u?.id ?? null)).toEqual([null, 'user-1']);

        // INITIAL_SESSION, token refreshes and tab focus all hand out new objects.
        await emit('INITIAL_SESSION', shopper());
        await emit('TOKEN_REFRESHED', shopper());
        await emit('SIGNED_IN', shopper());

        expect(users).toHaveLength(2);
    });

    it('passes on a changed user, another user and sign-out', async () => {
        const users = renderAuth();
        await act(async () => {});

        await emit('USER_UPDATED', shopper({ updated_at: '2026-02-01T00:00:00Z' }));
        await emit('SIGNED_IN', shopper({ id: 'user-2', email: 'other@example.com' }));
        await emit('SIGNED_OUT', null);

        expect(users.map(u => u && `${u.id}@${u.updated_at}`)).toEqual([
            null,
            'user-1@2026-01-01T00:00:00Z',
            'user-1@2026-02-01T00:00:00Z',
            'user-2@2026-01-01T00:00:00Z',
            null,
        ]);
    });
});
