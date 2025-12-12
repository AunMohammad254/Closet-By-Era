import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

// Mock data for accessories products
const accessoriesProducts = [
    { id: 'acc-1', name: 'Signature Leather Tote Bag', price: 9990, originalPrice: 12990, image: '/products/w6.jpg', category: 'Bags', isNew: true },
    { id: 'acc-2', name: 'Classic Gold Watch', price: 15990, image: '/products/m6.jpg', category: 'Watches' },
    { id: 'acc-3', name: 'Pearl Drop Earrings', price: 3490, image: '/products/w1.jpg', category: 'Jewelry', isNew: true },
    { id: 'acc-4', name: 'Silk Printed Scarf', price: 2990, originalPrice: 3990, image: '/products/w4.jpg', category: 'Scarves', isSale: true },
    { id: 'acc-5', name: 'Premium Leather Belt', price: 3990, image: '/products/m2.jpg', category: 'Belts' },
    { id: 'acc-6', name: 'Designer Sunglasses', price: 6990, originalPrice: 8990, image: '/products/m3.jpg', category: 'Eyewear', isSale: true },
    { id: 'acc-7', name: 'Minimalist Chain Necklace', price: 4490, image: '/products/w3.jpg', category: 'Jewelry', isNew: true },
    { id: 'acc-8', name: 'Canvas Weekend Bag', price: 7990, image: '/products/m1.jpg', category: 'Bags' },
    { id: 'acc-9', name: 'Cashmere Wool Scarf', price: 5490, image: '/products/w5.jpg', category: 'Scarves' },
    { id: 'acc-10', name: 'Silver Cuff Bracelet', price: 2990, originalPrice: 4490, image: '/products/w7.jpg', category: 'Jewelry', isSale: true },
    { id: 'acc-11', name: 'Leather Card Holder', price: 1990, image: '/products/m4.jpg', category: 'Wallets', isNew: true },
    { id: 'acc-12', name: 'Statement Ring Set', price: 3990, image: '/products/w8.jpg', category: 'Jewelry' },
];

export default function AccessoriesPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-amber-600 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-gray-900 mb-4">Accessories</h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Complete your look with our curated selection of premium accessories. From elegant jewelry to statement bags.
                    </p>
                </div>
            </section>

            {/* Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Bags', 'Jewelry', 'Watches', 'Scarves', 'Belts', 'Eyewear', 'Wallets'].map((cat) => (
                                <button
                                    key={cat}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${cat === 'All'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">{accessoriesProducts.length} products</span>
                            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                                <option>Newest</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                        {accessoriesProducts.map((product) => (
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
                </div>
            </section>

            <Footer />
        </main>
    );
}
