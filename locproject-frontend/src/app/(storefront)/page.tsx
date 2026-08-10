'use client';

import Navbar from '../../components/storefront/layout/Navbar';
import Footer from '../../components/storefront/layout/Footer';
import HeroSection from '../../components/storefront/HeroSection';
import BannerCarousel from '../../components/storefront/BannerCarousel';
import TrustBar from '../../components/storefront/home/TrustBar';
import CategoryGrid from '../../components/storefront/home/CategoryGrid';
import FeaturedProducts from '../../components/storefront/home/FeaturedProducts';
import PromoBanner from '../../components/storefront/home/PromoBanner';
import BlogSection from '../../components/storefront/home/BlogSection';
import ConsultationForm from '../../components/storefront/home/ConsultationForm';
import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import { usePublicBlogPosts } from '../../lib/hooks/useMarketing';

export default function HomePage() {
  const [products, setProducts] = useState([]);
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

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">
        <HeroSection />
        <BannerCarousel />
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