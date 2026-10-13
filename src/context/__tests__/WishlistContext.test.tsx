import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import { WishlistProvider, useWishlist, type WishlistItem } from '@/context/WishlistContext';

/**
 * How many requests the wishlist makes for a signed-in shopper. The provider
 * talks to `wishlist_items` through this fake, which records every call.
 */

type Row = { id: string; product_id: string; product_name: string; product_price: number; product_image: string; category: string };

let mockUser: { id: string } | null = null;
let mockRows: Row[] = [];
let mockCalls: string[] = [];
/** When set, the next read waits for this promise. */
let mockReadGate: Promise<void> | null = null;

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: mockUser }),
}));

jest.mock('@/lib/supabase/client', () => {
    const client = {
        from: () => ({
            select: () => ({
                eq: async () => {
                    mockCalls.push('select');
                    const gate = mockReadGate;
                    mockReadGate = null;
                    if (gate) await gate;
                    return { data: mockRows, error: null };
                },
            }),
            upsert: async (rows: Omit<Row, 'id'>[]) => {
                mockCalls.push(`upsert ${rows.length}`);
                for (const r of rows) {
                    if (!mockRows.some(existing => existing.product_id === r.product_id)) {
                        mockRows.push({ id: `row-${r.product_id}`, ...r });
                    }
                }
                return { error: null };
            },
            delete: () => ({
                eq: async () => {
                    mockCalls.push('delete all');
                    mockRows = [];
                    return { error: null };
                },
                in: async (_column: string, ids: string[]) => {
                    mockCalls.push(`delete ${ids.length}`);
                    mockRows = mockRows.filter(r => !ids.includes(r.id));
                    return { error: null };
                },
            }),
        }),
    };
    // A singleton, like the real browser client.
    return { createClient: () => client };
});

const STORAGE_KEY = 'closet-by-era-wishlist';
const item = (id: string): WishlistItem => ({ id, name: `Product ${id}`, price: 1000, image: `/${id}.jpg`, category: 'Shirts' });
const row = (id: string): Row => ({ id: `row-${id}`, product_id: id, product_name: `Product ${id}`, product_price: 1000, product_image: `/${id}.jpg`, category: 'Shirts' });

let current: ReturnType<typeof useWishlist>;
function Probe() {
    const value = useWishlist();
    useEffect(() => { current = value; });
    return null;
}

/**
 * Runs the debounce timers and the async work they start. React applies state
 * updates when act() ends, so timers they schedule need another round.
 */
async function settle() {
    for (let round = 0; round < 3; round++) {
        await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    }
}

beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    mockUser = { id: 'user-1' };
    mockRows = [];
    mockCalls = [];
    mockReadGate = null;
});

afterEach(() => {
    jest.useRealTimers();
});

describe('WishlistProvider for a signed-in shopper', () => {
    it('only reads when the saved wishlist already matches the local one', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([item('a')]));
        mockRows = [row('a')];

        render(<WishlistProvider><Probe /></WishlistProvider>);
        await settle();

        expect(mockCalls).toEqual(['select']);
        expect(current.items.map(i => i.id)).toEqual(['a']);
    });

    it('saves local-only items once, without deleting the account\'s items', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([item('a'), item('b')]));
        mockRows = [row('a'), row('c')];

        render(<WishlistProvider><Probe /></WishlistProvider>);
        await settle();

        expect(current.items.map(i => i.id)).toEqual(['a', 'b', 'c']);
        expect(mockCalls).toEqual(['select', 'select', 'upsert 3']);

        await settle();
        expect(mockCalls).toHaveLength(3);
    });

    it('does not sync the local list before the account\'s wishlist has been read', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([item('a')]));
        mockRows = [row('a'), row('saved-elsewhere')];
        let release!: () => void;
        mockReadGate = new Promise(resolve => { release = resolve; });

        render(<WishlistProvider><Probe /></WishlistProvider>);
        // Well past the 500ms debounce while the read is still in flight.
        await settle();
        expect(mockCalls).toEqual(['select']);

        await act(async () => { release(); });
        await settle();

        expect(current.items.map(i => i.id)).toEqual(['a', 'saved-elsewhere']);
        expect(mockCalls).toEqual(['select']);
    });

    it('writes each change once', async () => {
        mockRows = [row('a')];
        render(<WishlistProvider><Probe /></WishlistProvider>);
        await settle();

        act(() => current.removeItem('a'));
        await settle();
        act(() => current.addItem(item('b')));
        await settle();

        expect(mockCalls).toEqual(['select', 'delete all', 'select', 'upsert 1']);
    });
});
