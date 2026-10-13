/**
 * Listing data and the category filter / sort used by the department, sale and
 * new-arrival pages. Pure, so the server page and the client list agree.
 */

/** What a listing card needs; nothing more is fetched or sent to the browser. */
export interface CatalogProduct {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    isNew: boolean;
    isSale: boolean;
    isFeatured: boolean;
    /** created_at as epoch milliseconds */
    createdAt: number;
}

export interface Catalog {
    /** Category names offered as filters, in display order (without "All"). */
    categoryNames: string[];
    products: CatalogProduct[];
}

export const ALL_CATEGORIES = 'All';

export type CatalogSort =
    | 'Newest'
    | 'Price: Low to High'
    | 'Price: High to Low'
    | 'Best Selling'
    | 'Featured'
    | 'Biggest Discount';

export function discountPercent(product: Pick<CatalogProduct, 'price' | 'originalPrice'>): number {
    if (!product.originalPrice) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

/** No sales data yet: sale items first, then new ones. */
const bestSellingScore = (p: CatalogProduct) => (p.isSale ? 2 : 0) + (p.isNew ? 1 : 0);

const COMPARATORS: Record<CatalogSort, (a: CatalogProduct, b: CatalogProduct) => number> = {
    'Newest': (a, b) => b.createdAt - a.createdAt,
    'Price: Low to High': (a, b) => a.price - b.price,
    'Price: High to Low': (a, b) => b.price - a.price,
    'Best Selling': (a, b) => bestSellingScore(b) - bestSellingScore(a),
    'Featured': (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
    'Biggest Discount': (a, b) => discountPercent(b) - discountPercent(a),
};

/** The products in `category` (or all), in `sort` order. Never mutates `products`. */
export function filterAndSortCatalog(
    products: CatalogProduct[],
    category: string,
    sort: CatalogSort
): CatalogProduct[] {
    const visible = category === ALL_CATEGORIES
        ? [...products]
        : products.filter(product => product.category === category);
    return visible.sort(COMPARATORS[sort]);
}
