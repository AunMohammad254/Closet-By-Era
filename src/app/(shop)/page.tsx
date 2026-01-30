import Hero from '@/components/Hero';
import CategorySection from '@/components/CategorySection';
import FeaturedProducts from '@/components/FeaturedProducts';
import PromoSection from '@/components/PromoSection';
import Newsletter from '@/components/Newsletter';

import { getStoreSettings } from '@/actions/settings';

export default async function Home() {
  const { data: settings } = await getStoreSettings();

  return (
    <main className="min-h-screen bg-white">
      <Hero
        title={settings?.content?.hero_title}
        subtitle={settings?.content?.hero_subtitle}
      />
      <CategorySection />
      <FeaturedProducts />
      <PromoSection />
      <Newsletter />
    </main>
  );
}
