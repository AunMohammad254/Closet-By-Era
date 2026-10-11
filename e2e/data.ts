/** Fixed rows from e2e/supabase/seed.sql that tests refer to. */

export const PRODUCTS = {
    overcoat: { id: 'e6db4a4b-1e33-4417-a88a-9ffd0af2ad92', name: 'Signature Wool Blend Overcoat', slug: 'signature-wool-blend-overcoat', price: 12990 },
    chinos: { id: '70cf5c07-023a-4658-b0d5-abeedca103d1', name: 'Slim Fit Stretch Chinos', slug: 'slim-fit-stretch-chinos', price: 5990 },
    belt: { id: 'a4be9aee-8b62-4061-9384-a2d61ef0481b', name: 'Classic Leather Belt', slug: 'classic-leather-belt', price: 2990 },
    floral: { id: '8ed3d97d-a4fe-445a-b921-f36e080e5b3c', name: 'Midnight Floral', slug: null, price: 2900 },
    shirt: { id: '0e2e0000-0000-4000-8000-000000000001', name: 'E2E Oxford Shirt', slug: 'e2e-oxford-shirt', price: 3500 },
    soldOut: { id: '0e2e0000-0000-4000-8000-000000000002', name: 'E2E Cashmere Sweater', slug: 'e2e-cashmere-sweater', price: 8900 },
    sale: { id: '0e2e0000-0000-4000-8000-000000000003', name: 'E2E Linen Dress', slug: 'e2e-linen-dress', price: 4000, originalPrice: 5000 },
    lowStock: { id: '0e2e0000-0000-4000-8000-000000000004', name: 'E2E Silk Blouse', slug: 'e2e-silk-blouse', price: 2500, stock: 2 },
    hidden: { id: '0e2e0000-0000-4000-8000-000000000005', name: 'E2E Hidden Blazer', slug: 'e2e-hidden-blazer', price: 9900 },
} as const;

export type ProductKey = keyof typeof PRODUCTS;

export const productPath = (key: ProductKey) => {
    const p = PRODUCTS[key];
    return `/product/${p.slug ?? p.id}`;
};

export const COUPONS = {
    tenPercent: 'E2E10',
    flat500: 'E2EFLAT500',
    expired: 'E2EEXPIRED',
    bigSpend: 'E2EBIGSPEND',
    usedUp: 'E2EUSEDUP',
    inactive: 'E2EINACTIVE',
} as const;

export const GIFT_CARDS = {
    partial: { code: 'GIFT-E2E-1000', balance: 1000 },
    full: { code: 'GIFT-E2E-FULL', balance: 1000000 },
    empty: { code: 'GIFT-E2E-EMPTY', balance: 0 },
} as const;

export const BANK = { name: 'E2E Test Bank', accountNumber: '0000-1111-2222', iban: 'PK00TEST0000000000000000' };

/** Checkout pricing rules (src/lib/pricing.ts). */
export const SHIPPING = { freeOver: 5000, standard: 500, expressSurcharge: 300 };
