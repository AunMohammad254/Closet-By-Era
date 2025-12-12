import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategorySection from '@/components/CategorySection';
import FeaturedProducts from '@/components/FeaturedProducts';
import PromoSection from '@/components/PromoSection';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <PromoSection />
      <Newsletter />
      <Footer />
    </main>
  );
}
