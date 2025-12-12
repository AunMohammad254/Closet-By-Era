import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

// Mock data for men's products
const menProducts = [
    { id: '1', name: 'Premium Cotton Oxford Shirt', price: 4490, image: '/products/m1.jpg', category: 'Shirts', isNew: true },
    { id: '2', name: 'Slim Fit Stretch Chinos', price: 5990, originalPrice: 7490, image: '/products/m2.jpg', category: 'Pants', isSale: true },
    { id: '3', name: 'Tailored Blazer', price: 14990, image: '/products/m3.jpg', category: 'Outerwear', isNew: true },
    { id: '4', name: 'Relaxed Fit Denim Jeans', price: 6490, image: '/products/m4.jpg', category: 'Denim' },
    { id: '5', name: 'Cotton Polo Shirt', price: 3990, image: '/products/m5.jpg', category: 'Shirts' },
    { id: '6', name: 'Classic Leather Belt', price: 2990, originalPrice: 3990, image: '/products/m6.jpg', category: 'Accessories', isSale: true },
    { id: '7', name: 'Wool Blend Pullover', price: 7990, image: '/products/m7.jpg', category: 'Knitwear' },
    { id: '8', name: 'Casual Linen Shirt', price: 4990, image: '/products/m8.jpg', category: 'Shirts', isNew: true },
];

export default function MenPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-slate-300/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gray-300/30 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-slate-600 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-gray-900 mb-4">Men</h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Explore our refined collection of men&apos;s fashion. Timeless pieces crafted for the modern gentleman.
                    </p>
                </div>
            </section>

            {/* Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Shirts', 'Pants', 'Denim', 'Outerwear', 'Knitwear', 'Accessories'].map((cat) => (
                                <button
                                    key={cat}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${cat === 'All'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">{menProducts.length} products</span>
                            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500">
                                <option>Newest</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                        {menProducts.map((product) => (
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
