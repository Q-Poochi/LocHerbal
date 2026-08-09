'use client';

import Navbar from '../../components/storefront/layout/Navbar';
import Footer from '../../components/storefront/layout/Footer';
import HeroBanner from '../../components/storefront/home/HeroBanner';
import BannerCarousel from '../../components/storefront/home/BannerCarousel';
import TrustBar from '../../components/storefront/home/TrustBar';
import CategoryGrid from '../../components/storefront/home/CategoryGrid';
import FeaturedProducts from '../../components/storefront/home/FeaturedProducts';
import PromoBanner from '../../components/storefront/home/PromoBanner';
import BlogSection from '../../components/storefront/home/BlogSection';
import ConsultationForm from '../../components/storefront/home/ConsultationForm';
import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import { usePublicBanners, usePublicBlogPosts } from '../../lib/hooks/useMarketing';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const { data: banners = [] } = usePublicBanners();
  const { data: blogPosts = [] } = usePublicBlogPosts();

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes] = await Promise.all([
          apiClient.get('/products', { params: { limit: 8 } }),
        ]);
        setProducts(productsRes.data?.data ?? productsRes.data ?? []);
      } catch {
        setProducts([]);
      }
    }
    fetchData();
  }, []);

  const heroBanners = banners.filter((b) => b.position === 'home');

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">
        <HeroBanner />
        <BannerCarousel banners={heroBanners} />
        <TrustBar />
        <CategoryGrid />
        <FeaturedProducts products={products} />
        <PromoBanner />
        <BlogSection posts={blogPosts} />
        <ConsultationForm />
      </main>
      <Footer />
    </>
  );
}