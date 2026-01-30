import Image from 'next/image';
import Link from 'next/link';

interface HeroSlide {
    id: number;
    title: string;
    subtitle: string;
    buttonText: string;
    link: string;
    image: string;
    position?: 'left' | 'center' | 'right';
}

const heroSlides: HeroSlide[] = [
    {
        id: 1,
        title: "Winter Collection '24",
        subtitle: "Discover timeless elegance with our latest winter essentials. Crafted for comfort, styled for you.",
        buttonText: "Shop Now",
        link: "/women",
        image: "/hero/winter-collection.jpg",
        position: 'left',
    },
];

export default function Hero() {
    const slide = heroSlides[0];

    return (
        <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
            {/* Background Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent z-10" />

            {/* Animated Background Pattern */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover object-center opacity-40 mix-blend-overlay"
                    priority
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(244,63,94,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 opacity-90" />
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-20 right-20 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl animate-pulse z-0" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse z-0" style={{ animationDelay: '1s' }} />

            {/* Content */}
            <div className="relative z-20 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-2xl">
                        {/* Badge */}
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
                            <span className="w-2 h-2 bg-rose-500 rounded-full mr-3 animate-pulse" />
                            <span className="text-sm text-white/90 tracking-wider font-light">NEW ARRIVALS</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                            <span className="block font-light">{slide.title.split(' ')[0]}</span>
                            <span className="block bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400 bg-clip-text text-transparent">
                                {slide.title.split(' ').slice(1).join(' ')}
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-lg font-light">
                            {slide.subtitle}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href={slide.link}
                                className="group inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 font-medium rounded-full hover:bg-rose-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {slide.buttonText}
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                href="/lookbook"
                                className="inline-flex items-center justify-center px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                            >
                                View Lookbook
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-8 mt-14 pt-8 border-t border-white/10">
                            <div>
                                <p className="text-3xl font-bold text-white">500+</p>
                                <p className="text-sm text-gray-400 mt-1">Products</p>
                            </div>
                            <div className="w-px h-12 bg-white/20" />
                            <div>
                                <p className="text-3xl font-bold text-white">10K+</p>
                                <p className="text-sm text-gray-400 mt-1">Customers</p>
                            </div>
                            <div className="w-px h-12 bg-white/20" />
                            <div>
                                <p className="text-3xl font-bold text-white">4.9</p>
                                <p className="text-sm text-gray-400 mt-1">Rating</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <div className="flex flex-col items-center text-white/60">
                    <span className="text-xs tracking-widest mb-3">SCROLL</span>
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                        <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
                    </div>
                </div>
            </div>
        </section>
    );
}
