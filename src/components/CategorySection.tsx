import Link from 'next/link';

interface Category {
    id: string;
    name: string;
    itemCount: number;
    image: string;
    href: string;
}

const categories: Category[] = [
    { id: '1', name: 'Women', itemCount: 234, image: '/categories/women.jpg', href: '/women' },
    { id: '2', name: 'Men', itemCount: 189, image: '/categories/men.jpg', href: '/men' },
    { id: '3', name: 'Accessories', itemCount: 67, image: '/categories/accessories.jpg', href: '/accessories' },
    { id: '4', name: 'New Arrivals', itemCount: 45, image: '/categories/new.jpg', href: '/new-arrivals' },
];

export default function CategorySection() {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-14">
                    <span className="text-rose-600 text-sm font-medium tracking-widest uppercase">Explore</span>
                    <h2 className="mt-3 text-4xl font-bold text-gray-900">Shop by Category</h2>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                        Discover curated collections designed to elevate your wardrobe
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => (
                        <Link
                            key={category.id}
                            href={category.href}
                            className="group relative aspect-[4/5] rounded-2xl overflow-hidden"
                        >
                            {/* Background */}
                            <div className={`absolute inset-0 ${index === 0 ? 'bg-gradient-to-br from-rose-100 via-rose-50 to-amber-50' :
                                    index === 1 ? 'bg-gradient-to-br from-slate-200 via-slate-100 to-gray-50' :
                                        index === 2 ? 'bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50' :
                                            'bg-gradient-to-br from-violet-100 via-purple-50 to-rose-50'
                                }`} />

                            {/* Decorative Icon */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <svg className="w-40 h-40 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {index === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                                    {index === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                                    {index === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />}
                                    {index === 3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />}
                                </svg>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-6">
                                <div className="transform group-hover:-translate-y-2 transition-transform duration-300">
                                    <p className="text-sm text-gray-600 mb-1">{category.itemCount} items</p>
                                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                                        {category.name}
                                    </h3>
                                </div>

                                {/* Arrow */}
                                <div className="absolute bottom-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
