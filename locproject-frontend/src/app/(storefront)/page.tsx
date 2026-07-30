'use client';

import Navbar from '../../components/storefront/layout/Navbar';
import Footer from '../../components/storefront/layout/Footer';
import HeroBanner from '../../components/storefront/home/HeroBanner';
import TrustBar from '../../components/storefront/home/TrustBar';
import CategoryGrid from '../../components/storefront/home/CategoryGrid';
import FeaturedProducts from '../../components/storefront/home/FeaturedProducts';
import PromoBanner from '../../components/storefront/home/PromoBanner';
import BlogSection from '../../components/storefront/home/BlogSection';
import ConsultationForm from '../../components/storefront/home/ConsultationForm';
import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          apiClient.get('/products', { params: { limit: 8 } }),
          apiClient.get('/categories'),
        ]);
        setProducts(productsRes.data?.data ?? productsRes.data ?? []);
        setCategories(categoriesRes.data?.data ?? categoriesRes.data ?? []);
      } catch {
        setProducts([]);
        setCategories([]);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">
        <HeroBanner />
        <TrustBar />
        <CategoryGrid categories={categories} />
        <FeaturedProducts products={products} />
        <PromoBanner />
        <BlogSection posts={[]} />
        <ConsultationForm />
      </main>
      <Footer />
    </>
  );
}