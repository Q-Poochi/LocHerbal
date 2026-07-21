'use client';

import Navbar from '../../components/storefront/layout/Navbar';
import Footer from '../../components/storefront/layout/Footer';
import HeroBanner from '../../components/storefront/home/HeroBanner';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          apiClient.get('/products', { params: { limit: 4 } }),
          apiClient.get('/categories'),
        ]);
        console.log('Featured products response:', productsRes.data);
        setProducts(productsRes.data?.data ?? productsRes.data ?? []);
        setCategories(categoriesRes.data?.data ?? categoriesRes.data ?? []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <HeroBanner />

        {/* Trust Badges */}
        <section className="w-full bg-surface py-12 relative z-20 -mt-10">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="bg-white rounded-xl shadow-lg grid grid-cols-2 md:grid-cols-4 gap-6 p-8 border border-outline-variant">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div>
                  <h4 className="font-label-bold text-label-bold text-primary">Sản phẩm chính hãng</h4>
                  <p className="text-body-sm text-on-surface-variant">Cam kết 100% tự nhiên</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                </div>
                <div>
                  <h4 className="font-label-bold text-label-bold text-primary">Miễn phí ship</h4>
                  <p className="text-body-sm text-on-surface-variant">Đơn hàng từ 500K</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>currency_exchange</span>
                </div>
                <div>
                  <h4 className="font-label-bold text-label-bold text-primary">Hoàn tiền 30 ngày</h4>
                  <p className="text-body-sm text-on-surface-variant">Nếu không hài lòng</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                </div>
                <div>
                  <h4 className="font-label-bold text-label-bold text-primary">Tư vấn chuyên gia</h4>
                  <p className="text-body-sm text-on-surface-variant">Tận tâm, chuyên nghiệp</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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