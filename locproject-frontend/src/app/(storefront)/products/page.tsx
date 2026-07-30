'use client';

import Navbar from '../../../components/storefront/layout/Navbar';
import Footer from '../../../components/storefront/layout/Footer';
import FilterSidebar from '../../../components/storefront/FilterSidebar';
import SortBar from '../../../components/storefront/SortBar';
import ProductGrid from '../../../components/storefront/ProductGrid';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '../../../lib/hooks/useProducts';

const CATEGORY_INFOS: Record<string, { title: string; desc: string }> = {
  'tim-mach': {
    title: 'Tim Mạch',
    desc: 'Tập hợp các giải pháp thảo dược tự nhiên hỗ trợ sức khỏe tim mạch, ổn định huyết áp và lưu thông máu huyết. Được nghiên cứu kỹ lưỡng dựa trên y học cổ truyền kết hợp công nghệ chiết xuất hiện đại.',
  },
  'xuong-khop': {
    title: 'Xương Khớp',
    desc: 'Hỗ trợ tái tạo sụn khớp, giảm đau lưng, mỏi gối, tăng tiết dịch khớp giúp vận động linh hoạt và làm chậm quá trình thoái hóa khớp.',
  },
  'tieu-hoa': {
    title: 'Tiêu Hóa',
    desc: 'Bảo vệ dạ dày và đại tràng, tăng cường chức năng tiêu hóa, giảm nhanh các tình trạng khó chịu như đầy bụng, khó tiêu và ợ chua.',
  },
  'an-than-ngu-ngon': {
    title: 'An Thần Ngủ Ngon',
    desc: 'Bồi bổ tâm huyết, thư giãn hệ thần kinh, giảm căng thẳng mệt mỏi giúp bạn dễ dàng đi vào giấc ngủ ngon và sâu giấc tự nhiên.',
  },
};

export default function ProductsPage() {
  return (
    <>
      <Navbar />

      <main className="w-full py-8 bg-surface">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters */}
            <Suspense fallback={<div className="w-64 h-96 bg-gray-100 animate-pulse rounded-2xl" />}>
              <FilterSidebar />
            </Suspense>

            {/* Right Content Area */}
            <div className="flex-1">
              <Suspense fallback={<div className="h-40 bg-white animate-pulse rounded-2xl mb-8" />}>
                <HeaderSection />
              </Suspense>

              {/* Sort & Filter Bar */}
              <Suspense fallback={<div className="h-12 bg-white animate-pulse rounded-2xl mb-6" />}>
                <SortBar />
              </Suspense>

              {/* Product Grid + Pagination */}
              <Suspense fallback={<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 min-h-[400px] bg-white animate-pulse rounded-2xl p-6" />}>
                <ProductGrid />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function HeaderSection() {
  const searchParams = useSearchParams();
  const catId = searchParams.get('categoryId') || '';
  const search = searchParams.get('search') || '';

  const info = CATEGORY_INFOS[catId] || {
    title: search ? `Tìm kiếm: "${search}"` : 'Tất cả sản phẩm',
    desc: search
      ? `Kết quả tìm kiếm cho từ khóa "${search}" trong danh mục sản phẩm thảo dược.`
      : 'Khám phá tất cả các sản phẩm thảo dược chất lượng cao được khuyên dùng bởi các chuyên gia y tế.',
  };

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-text-secondary mb-6 font-medium">
        <a className="hover:text-primary-700" href="/">Trang chủ</a>
        <span className="material-symbols-outlined text-[12px] leading-none text-text-tertiary">chevron_right</span>
        <a className="hover:text-primary-700" href="/products">Sản phẩm</a>
        {catId && (
          <>
            <span className="material-symbols-outlined text-[12px] leading-none text-text-tertiary">chevron_right</span>
            <span className="text-primary-700 font-semibold">{info.title}</span>
          </>
        )}
      </nav>

      {/* Title + Count */}
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="font-display font-bold text-3xl text-primary-700">{info.title}</h2>
        <ProductCount />
      </div>
      <p className="text-sm text-text-secondary max-w-3xl leading-relaxed">
        {info.desc}
      </p>
    </div>
  );
}

function ProductCount() {
  const searchParams = useSearchParams();
  const params = {
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as 'popular' | 'price_asc' | 'price_desc' | 'newest') || 'popular',
    page: 1,
    limit: 25,
    search: searchParams.get('search') || undefined,
  };
  const { data } = useProducts(params);
  const count = (data as any)?.totalCount ?? 0;
  return <span className="text-xs text-text-secondary font-medium">({count} sản phẩm)</span>;
}
