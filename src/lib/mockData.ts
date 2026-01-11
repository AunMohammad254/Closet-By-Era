export const mockProduct = {
    id: '1',
    name: 'Signature Wool Blend Overcoat',
    slug: 'signature-wool-blend-overcoat',
    price: 12990,
    originalPrice: 16990,
    description: 'A timeless overcoat crafted from premium wool blend fabric. Features a classic silhouette with modern detailing. Perfect for layering during the cold months while maintaining a sophisticated look.',
    shortDescription: 'Premium wool blend overcoat with classic silhouette',
    category: 'Outerwear',
    categorySlug: 'women-outerwear',
    images: [
        '/products/overcoat.png',
        '/products/overcoat.png',
        '/products/overcoat.png',
        '/products/overcoat.png',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
        { name: 'Black', hex: '#1a1a1a' },
        { name: 'Camel', hex: '#c19a6b' },
        { name: 'Navy', hex: '#1e3a5f' },
    ],
    inStock: true,
    isNew: true,
    isSale: true,
    features: [
        'Premium wool blend fabric',
        'Classic double-breasted design',
        'Satin lining',
        'Two front pockets',
        'Dry clean only',
    ],
    sku: 'WOC-001',
};

export const relatedProducts = [
    { id: '2', name: 'Cashmere Blend Sweater', price: 8990, image: '/products/cashmere-sweater.png', category: 'Knitwear' },
    { id: '3', name: 'Silk Blouse', price: 7490, originalPrice: 8990, image: '/products/silk-blouse.png', category: 'Tops', isSale: true },
    { id: '4', name: 'High-Waisted Wide Leg Pants', price: 5990, image: '/products/denim-jeans.png', category: 'Pants' },
    { id: '5', name: 'Linen Summer Dress', price: 6990, image: '/products/linen-dress.png', category: 'Dresses', isNew: true },
];
