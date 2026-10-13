import { ALL_CATEGORIES, discountPercent, filterAndSortCatalog, type CatalogProduct } from '@/lib/catalog-filter';

function product(overrides: Partial<CatalogProduct> & Pick<CatalogProduct, 'id'>): CatalogProduct {
    return {
        slug: overrides.id,
        name: overrides.id,
        price: 1000,
        image: '/products/placeholder.png',
        category: 'Shirts',
        isNew: false,
        isSale: false,
        isFeatured: false,
        createdAt: 0,
        ...overrides,
    };
}

const shirt = product({ id: 'shirt', price: 3000, createdAt: 3, category: 'Shirts', isFeatured: true });
const chinos = product({ id: 'chinos', price: 5000, createdAt: 1, category: 'Trousers', isNew: true });
const dress = product({ id: 'dress', price: 4000, originalPrice: 5000, createdAt: 2, category: 'Dresses', isSale: true });
const belt = product({ id: 'belt', price: 1000, originalPrice: 2000, createdAt: 4, category: 'Belts', isSale: true });

const ids = (list: CatalogProduct[]) => list.map(p => p.id);

describe('filterAndSortCatalog', () => {
    const all = [shirt, chinos, dress, belt];

    it('keeps every product for "All" and filters by category name otherwise', () => {
        expect(ids(filterAndSortCatalog(all, ALL_CATEGORIES, 'Newest'))).toEqual(['belt', 'shirt', 'dress', 'chinos']);
        expect(ids(filterAndSortCatalog(all, 'Trousers', 'Newest'))).toEqual(['chinos']);
        expect(filterAndSortCatalog(all, 'Hats', 'Newest')).toEqual([]);
    });

    it('sorts by price both ways', () => {
        expect(ids(filterAndSortCatalog(all, ALL_CATEGORIES, 'Price: Low to High'))).toEqual(['belt', 'shirt', 'dress', 'chinos']);
        expect(ids(filterAndSortCatalog(all, ALL_CATEGORIES, 'Price: High to Low'))).toEqual(['chinos', 'dress', 'shirt', 'belt']);
    });

    it('puts sale items, then new ones, first for "Best Selling" and keeps ties in order', () => {
        expect(ids(filterAndSortCatalog(all, ALL_CATEGORIES, 'Best Selling'))).toEqual(['dress', 'belt', 'chinos', 'shirt']);
    });

    it('puts featured products first', () => {
        expect(ids(filterAndSortCatalog(all, ALL_CATEGORIES, 'Featured'))[0]).toBe('shirt');
    });

    it('orders by the biggest discount', () => {
        expect(ids(filterAndSortCatalog(all, ALL_CATEGORIES, 'Biggest Discount')).slice(0, 2)).toEqual(['belt', 'dress']);
    });

    it('never reorders the list it was given', () => {
        const input = [shirt, chinos, dress, belt];
        filterAndSortCatalog(input, ALL_CATEGORIES, 'Price: High to Low');
        expect(ids(input)).toEqual(['shirt', 'chinos', 'dress', 'belt']);
    });
});

describe('discountPercent', () => {
    it('rounds the saving against the original price', () => {
        expect(discountPercent({ price: 4000, originalPrice: 5000 })).toBe(20);
        expect(discountPercent({ price: 2000, originalPrice: 3000 })).toBe(33);
    });

    it('is 0 without an original price', () => {
        expect(discountPercent({ price: 4000 })).toBe(0);
    });
});
