import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import { CartProvider, useCart, useCartActions } from '@/context/CartContext';

/**
 * What signing in costs: the provider merges the local cart with the saved one
 * through this fake `cart_items` table, which records every call.
 */

type Row = {
    id: string; product_id: string; product_name: string; product_price: number;
    product_image: string; size: string; color: string; quantity: number;
};

let mockUser: { id: string } | null = null;
let mockRows: Row[] = [];
let mockCalls: string[] = [];

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: mockUser }),
}));

jest.mock('@/lib/supabase/client', () => {
    const client = {
        from: () => ({
            select: () => ({
                eq: async () => { mockCalls.push('select'); return { data: mockRows, error: null }; },
            }),
            delete: () => ({
                eq: async () => { mockCalls.push('delete'); mockRows = []; return { error: null }; },
            }),
            insert: async (rows: Omit<Row, 'id'>[]) => {
                mockCalls.push(`insert ${rows.length}`);
                mockRows = rows.map((r, i) => ({ id: `row-${i}`, ...r }));
                return { error: null };
            },
        }),
    };
    // A singleton, like the real browser client.
    return { createClient: () => client };
});

const STORAGE_KEY = 'closet-by-era-cart';
const local = (productId: string) => ({
    id: `${productId}-local`, productId, name: `Product ${productId}`, price: 1000,
    image: `/${productId}.jpg`, size: 'M', color: '', quantity: 1,
});
const row = (productId: string): Row => ({
    id: `row-${productId}`, product_id: productId, product_name: `Product ${productId}`, product_price: 1000,
    product_image: `/${productId}.jpg`, size: 'M', color: '', quantity: 1,
});

let cart: ReturnType<typeof useCart>;
function Probe() {
    const value = useCart();
    useEffect(() => { cart = value; });
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
});

afterEach(() => {
    jest.useRealTimers();
});

describe('CartProvider sign-in merge', () => {
    it('only reads when the local cart already mirrors the saved one', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([local('a')]));
        mockRows = [row('a')];

        render(<CartProvider><Probe /></CartProvider>);
        await settle();

        expect(mockCalls).toEqual(['select']);
        expect(cart.itemCount).toBe(1);
    });

    it('loads the saved cart into a new browser without rewriting it', async () => {
        mockRows = [row('a')];

        render(<CartProvider><Probe /></CartProvider>);
        await settle();

        expect(mockCalls).toEqual(['select']);
        expect(cart.items.map(i => i.productId)).toEqual(['a']);
    });

    it('saves a guest cart to the account once', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([local('a')]));

        render(<CartProvider><Probe /></CartProvider>);
        await settle();

        expect(mockCalls).toEqual(['select', 'delete', 'insert 1']);
        expect(mockRows.map(r => r.product_id)).toEqual(['a']);
    });
});

describe('useCartActions', () => {
    it('keeps the same actions while the cart changes', async () => {
        mockUser = null;
        const seen = new Set<unknown>();
        function ActionsProbe() {
            const actions = useCartActions();
            useEffect(() => { seen.add(actions); });
            return null;
        }

        render(<CartProvider><Probe /><ActionsProbe /></CartProvider>);
        await settle();
        act(() => cart.addItem({ productId: 'a', name: 'A', price: 1, image: '', size: '', color: '', quantity: 1 }));
        act(() => cart.addItem({ productId: 'b', name: 'B', price: 1, image: '', size: '', color: '', quantity: 1 }));

        expect(cart.itemCount).toBe(2);
        expect(seen.size).toBe(1);
    });
});
