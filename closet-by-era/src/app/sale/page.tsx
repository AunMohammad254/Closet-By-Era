import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

// Mock data for sale products
const saleProducts = [
    { id: '1', name: 'Signature Wool Blend Overcoat', price: 12990, originalPrice: 16990, image: '/products/s1.jpg', category: 'Outerwear', isSale: true },
    { id: '2', name: 'Slim Fit Stretch Chinos', price: 5990, originalPrice: 7490, image: '/products/s2.jpg', category: 'Pants', isSale: true },
    { id: '3', name: 'Classic Leather Belt', price: 2990, originalPrice: 3990, image: '/products/s3.jpg', category: 'Accessories', isSale: true },
    { id: '4', name: 'Merino Wool Scarf', price: 3490, originalPrice: 4490, image: '/products/s4.jpg', category: 'Accessories', isSale: true },
    { id: '5', name: 'Leather Crossbody Bag', price: 7990, originalPrice: 9990, image: '/products/s5.jpg', category: 'Accessories', isSale: true },
    { id: '6', name: 'Silk Blouse', price: 7490, originalPrice: 8990, image: '/products/s6.jpg', category: 'Tops', isSale: true },
    { id: '7', name: 'Cashmere Sweater', price: 9990, originalPrice: 14990, image: '/products/s7.jpg', category: 'Knitwear', isSale: true },
    { id: '8', name: 'Premium Leather Loafers', price: 8990, originalPrice: 12990, image: '/products/s8.jpg', category: 'Footwear', isSale: true },
];

export default function SalePage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-rose-600 via-rose-500 to-red-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium tracking-wider mb-6">
                        LIMITED TIME
                    </span>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4">
                        Winter Sale
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl mb-8">
                        Up to 50% off on selected items. Don&apos;t miss out on our biggest sale of the season.
                    </p>
                    <div className="flex items-center gap-6 text-white/80">
                        <div>
                            <span className="text-3xl font-bold text-white">50%</span>
                            <span className="block text-sm">Max Discount</span>
                        </div>
                        <div className="w-px h-12 bg-white/30" />
                        <div>
                            <span className="text-3xl font-bold text-white">{saleProducts.length}</span>
                            <span className="block text-sm">Items on Sale</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Outerwear', 'Tops', 'Pants', 'Knitwear', 'Accessories'].map((cat) => (
                                <button
                                    key={cat}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${cat === 'All'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-600'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">{saleProducts.length} items on sale</span>
                            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
                                <option>Biggest Discount</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                        {saleProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                price={product.price}
                                originalPrice={product.originalPrice}
                                image={product.image}
                                category={product.category}
                                isSale={product.isSale}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
