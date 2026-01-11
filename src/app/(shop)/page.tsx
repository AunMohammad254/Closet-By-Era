import Hero from '@/components/Hero';
import CategorySection from '@/components/CategorySection';
import FeaturedProducts from '@/components/FeaturedProducts';
import PromoSection from '@/components/PromoSection';
import Newsletter from '@/components/Newsletter';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <PromoSection />
      <Newsletter />
    </main>
  );
}
