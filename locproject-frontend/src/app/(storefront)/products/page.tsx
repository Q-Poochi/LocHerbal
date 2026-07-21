'use client';

import Navbar from '../../../components/storefront/layout/Navbar';
import Footer from '../../../components/storefront/layout/Footer';
import FilterSidebar from '../../../components/storefront/FilterSidebar';
import SortBar from '../../../components/storefront/SortBar';
import ProductGrid from '../../../components/storefront/ProductGrid';
import Pagination from '../../../components/storefront/Pagination';
import { Suspense } from 'react';

export default function ProductsPage() {
  return (
    <>
      <Navbar />

      <main className="w-full py-8">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row gap-gutter">
            {/* Sidebar Filters */}
            <Suspense fallback={<div className="w-64 h-96 bg-surface-container-low animate-pulse rounded-lg" />}>
              <FilterSidebar />
            </Suspense>

            {/* Right Content Area */}
            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-caption text-outline mb-6">
                <a className="hover:text-primary" href="/">Trang chủ</a>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <a className="hover:text-primary" href="/products">Sản phẩm</a>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-medium">Tim Mạch</span>
              </nav>

              {/* Category Header */}
              <div className="mb-8">
                <div className="flex items-end gap-4 mb-2">
                  <h2 className="font-display-lg text-display-lg text-primary">Tim Mạch</h2>
                  <Suspense fallback={<span className="text-body-sm text-outline pb-1">(đang tải...)</span>}>
                    <ProductCount />
                  </Suspense>
                </div>
                <p className="text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                  Tập hợp các giải pháp thảo dược tự nhiên hỗ trợ sức khỏe tim mạch, ổn định huyết áp và lưu thông máu huyết. Được nghiên cứu kỹ lưỡng dựa trên y học cổ truyền kết hợp công nghệ chiết xuất hiện đại.
                </p>
              </div>

              {/* Sort & Filter Bar */}
              <Suspense fallback={<div className="h-12 bg-surface-container-low animate-pulse rounded-lg mb-6" />}>
                <SortBar />
              </Suspense>

              {/* Product Grid */}
              <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12 h-96 bg-surface-container-low animate-pulse rounded-lg" />}>
                <ProductGrid />
              </Suspense>

              {/* Pagination */}
              <Suspense fallback={null}>
                <Pagination />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// Component con để hiển thị số lượng sản phẩm
function ProductCount() {
  // Sẽ được cập nhật bởi ProductGrid qua context hoặc props
  return <span className="text-body-sm text-outline pb-1">(0 sản phẩm)</span>;
}