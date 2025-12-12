export default function PromoSection() {
    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Promo Card 1 */}
                    <div className="group relative rounded-3xl overflow-hidden min-h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                        {/* Decorative Elements */}
                        <div className="absolute top-10 right-10 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl" />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col justify-center p-10 lg:p-14">
                            <span className="inline-flex w-fit items-center px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-medium tracking-wider mb-6">
                                LIMITED OFFER
                            </span>
                            <h3 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
                                Winter Sale<br />
                                <span className="text-rose-400">Up to 50% Off</span>
                            </h3>
                            <p className="text-gray-300 mb-8 max-w-sm">
                                Don&apos;t miss out on our biggest sale of the season. Premium styles at unbeatable prices.
                            </p>
                            <a
                                href="/sale"
                                className="inline-flex w-fit items-center justify-center px-6 py-3 bg-white text-slate-900 font-medium rounded-full hover:bg-rose-50 transition-all duration-300 group-hover:shadow-xl"
                            >
                                Shop Sale
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Promo Card 2 */}
                    <div className="group relative rounded-3xl overflow-hidden min-h-[400px] bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-200/50 rounded-full blur-3xl" />
                        <div className="absolute bottom-10 left-10 w-40 h-40 bg-amber-200/50 rounded-full blur-2xl" />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col justify-center p-10 lg:p-14">
                            <span className="inline-flex w-fit items-center px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium tracking-wider mb-6">
                                NEW COLLECTION
                            </span>
                            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-4">
                                Spring &apos;25<br />
                                <span className="text-rose-600">Preview</span>
                            </h3>
                            <p className="text-gray-600 mb-8 max-w-sm">
                                Be the first to explore our upcoming spring collection. Fresh designs, timeless elegance.
                            </p>
                            <a
                                href="/new-arrivals"
                                className="inline-flex w-fit items-center justify-center px-6 py-3 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-all duration-300 group-hover:shadow-xl"
                            >
                                Explore Now
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
