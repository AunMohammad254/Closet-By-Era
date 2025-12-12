import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

// Mock data for women's products
const womenProducts = [
    { id: '1', name: 'Signature Wool Blend Overcoat', price: 12990, originalPrice: 16990, image: '/products/w1.jpg', category: 'Outerwear', isNew: true },
    { id: '2', name: 'Cashmere Blend Sweater', price: 8990, image: '/products/w2.jpg', category: 'Knitwear' },
    { id: '3', name: 'Linen Summer Dress', price: 6990, image: '/products/w3.jpg', category: 'Dresses', isNew: true },
    { id: '4', name: 'Silk Blouse', price: 7490, originalPrice: 8990, image: '/products/w4.jpg', category: 'Tops', isSale: true },
    { id: '5', name: 'High-Waisted Wide Leg Pants', price: 5990, image: '/products/w5.jpg', category: 'Pants' },
    { id: '6', name: 'Leather Crossbody Bag', price: 7990, originalPrice: 9990, image: '/products/w6.jpg', category: 'Accessories', isSale: true },
    { id: '7', name: 'Midi Pleated Skirt', price: 4990, image: '/products/w7.jpg', category: 'Skirts', isNew: true },
    { id: '8', name: 'Cotton Cardigan', price: 5490, image: '/products/w8.jpg', category: 'Knitwear' },
];

export default function WomenPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <span className="text-rose-600 text-sm font-medium tracking-widest uppercase">Collection</span>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-bold text-gray-900 mb-4">Women</h1>
                    <p className="text-lg text-gray-600 max-w-2xl">
                        Discover our curated selection of premium women&apos;s fashion. From elegant dresses to everyday essentials.
                    </p>
                </div>
            </section>

            {/* Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Outerwear', 'Dresses', 'Tops', 'Pants', 'Knitwear', 'Accessories'].map((cat) => (
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
                            <span className="text-sm text-gray-500">{womenProducts.length} products</span>
                            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
                                <option>Newest</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                        {womenProducts.map((product) => (
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
