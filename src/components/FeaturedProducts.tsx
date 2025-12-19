import ProductCard from './ProductCard';

// Products with real generated images
const featuredProducts = [
    { id: '1', name: 'Signature Wool Blend Overcoat', price: 12990, originalPrice: 16990, image: '/products/overcoat.png', category: 'Outerwear', isNew: true },
    { id: '2', name: 'Premium Cotton Oxford Shirt', price: 4490, image: '/products/oxford-shirt.png', category: 'Shirts', isNew: true },
    { id: '3', name: 'Cashmere Blend Sweater', price: 8990, image: '/products/cashmere-sweater.png', category: 'Knitwear' },
    { id: '4', name: 'Tailored Blazer', price: 14990, image: '/products/tailored-blazer.png', category: 'Outerwear', isNew: true },
    { id: '5', name: 'Linen Summer Dress', price: 6990, image: '/products/linen-dress.png', category: 'Dresses', isNew: true },
    { id: '6', name: 'Leather Crossbody Bag', price: 7990, originalPrice: 9990, image: '/products/leather-bag.png', category: 'Accessories', isSale: true },
    { id: '7', name: 'Relaxed Fit Denim Jeans', price: 6490, image: '/products/denim-jeans.png', category: 'Denim' },
    { id: '8', name: 'Silk Blouse', price: 7490, originalPrice: 8990, image: '/products/silk-blouse.png', category: 'Tops', isSale: true },
];

export default function FeaturedProducts() {
    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12">
                    <div>
                        <span className="text-rose-600 text-sm font-medium tracking-widest uppercase">Trending Now</span>
                        <h2 className="mt-3 text-4xl font-bold text-gray-900">Featured Products</h2>
                        <p className="mt-4 text-gray-600 max-w-lg">
                            Handpicked selections that define contemporary style
                        </p>
                    </div>
                    <a
                        href="/products"
                        className="mt-6 sm:mt-0 inline-flex items-center text-sm font-medium text-gray-900 hover:text-rose-600 transition-colors group"
                    >
                        View All Products
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                    {featuredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            name={product.name}
                            price={product.price}
                            originalPrice={product.originalPrice}
                            image={product.image}
                            category={product.category}
                            isNew={product.isNew}
                            isSale={product.isSale}
                        />
                    ))}
                </div>

                {/* Load More */}
                <div className="mt-14 text-center">
                    <a
                        href="/products"
                        className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-900 text-gray-900 font-medium rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300"
                    >
                        Load More Products
                    </a>
                </div>
            </div>
        </section>
    );
}
