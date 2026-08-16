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
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import { usePublicBlogPosts } from '../../lib/hooks/useMarketing';
import type { Product } from '@/types/api.types';

type LoadState = 'loading' | 'success' | 'error';

// Fetch sản phẩm với retry — tránh trang trống khi backend đang "wake" (trial plan
// của Railway ép sleep service sau ~15-30 phút không traffic; request đầu sẽ chờ
// instance khởi động lại).
async function fetchProducts(retries = 2, timeoutMs = 30000): Promise<Product[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await apiClient.get('/products', {
        params: { limit: 8 },
        timeout: timeoutMs,
      });
      return res.data?.data ?? res.data ?? [];
    } catch (err) {
      if (attempt >= retries) throw err;
      // Lần fail đầu thường là do backend đang khởi động lại — đợi rồi thử lại
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const { data: blogPosts = [] } = usePublicBlogPosts();

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setProducts(await fetchProducts());
      setLoadState('success');
    } catch {
      setProducts([]);
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">
        <HeroSection />
        <BannerCarousel />
        <TrustBar />
        <CategoryGrid />
        <FeaturedProducts products={products} loadState={loadState} onRetry={load} />
        <PromoBanner />
        <BlogSection posts={blogPosts} />
        <ConsultationForm />
      </main>
      <Footer />
    </>
  );
}