import { getSettings } from '@/lib/settings';
import { getCollections, listProducts } from '@/lib/catalog';
import { getLivePromotions } from '@/lib/promotions';
import { Hero } from '@/components/home/Hero';
import { FeaturedCollections } from '@/components/home/Collections';
import { Bestsellers } from '@/components/home/Bestsellers';
import { Offers } from '@/components/home/Offers';
import { WhyUs } from '@/components/home/WhyUs';
import { Showcase } from '@/components/home/Showcase';
import { NewArrivals } from '@/components/home/NewArrivals';
import { Newsletter } from '@/components/home/Newsletter';
import { FinalCta } from '@/components/home/FinalCta';
import { BackgroundTransitions } from '@/components/motion/Motion';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';

export default async function HomePage() {
  const [settings, collections, bestsellers, saleProducts, newArrivals, promotions] = await Promise.all([
    getSettings(),
    getCollections({ homepageOnly: true }),
    listProducts({ rule: 'bestseller', limit: 10 }),
    listProducts({ rule: 'on_sale', sort: 'discount', limit: 4 }),
    listProducts({ rule: 'new_arrival', sort: 'newest', limit: 10 }),
    getLivePromotions('offers_feature'),
  ]);

  return (
    <>
      <BackgroundTransitions />
      <Hero hero={settings.hero} />
      <FeaturedCollections collections={collections} />
      <Bestsellers products={bestsellers} />
      <Offers settings={settings.offers} promotions={promotions} products={saleProducts} />
      <WhyUs why={settings.why} />
      <Showcase showcase={settings.showcase} />
      <NewArrivals products={newArrivals} />
      <RecentlyViewed />
      <Newsletter newsletter={settings.newsletter} />
      <FinalCta cta={settings.finalCta} />
    </>
  );
}
