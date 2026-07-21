'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../../../types/api.types';
import AddToCartButton from '../product/AddToCartButton';

interface FeaturedProductsProps {
  products: Product[];
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1', name: 'Viên Uống Hoạt Huyết Dưỡng Não Thiên Sâm', slug: 'vien-uong-hoat-huyet-duong-nao-thien-sam',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-dK3dtBHf14BTHwAy8zLukDgPWiO8bKFfmcmyXR0FOlWUA-uwfK3kh1qdFaL-tvKpmKrRItf6MV5v0rFT4RNEMp6XReYS6kMJ05A2U0ECDJpBPnUGFggBAA2d_X-uPAwa5HrLShbsZ1Uqr8Vlv8dF7YqbhChkJ1nB2k5thQpg-T5taGjQb3jk1mgwYS9E429HsPc-mTM_ZrYvwb7VedTKiLO3ACBU0-ky1VFcHasGH6FfukbWSA',
    category: { name: 'Hệ Thần Kinh' },
    variants: [{ price: 295000, compareAtPrice: 350000 }],
  },
  {
    id: '2', name: 'Kem Thảo Dược Làm Dịu Da Chiết Xuất Khổ Qua', slug: 'kem-thao-duoc-lam-diu-da-chiet-xuat-kho-qua',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLzgM26_NNIpIj0xEpvvAgx7Nh_G-OCWBKnARUxd_XBKZCQBXdrOGtoiHA2ygxW0YkophLDxI3U4SDviJqRWrAWHxjVwINjLjOpTf7L7K7ptYq-X_eD-5rddTYCeEJjajriKz8_QkW10_bUH5BUr0AUCBu0vbcAIK2wR9EGH3fx9hWbUdzD033ADGmidl87TOkbqfAhRdirAggIz-UI9UOk7k-tcsZMQr5kdb7HUeGezIIMnYybQ',
    category: { name: 'Da Liễu' },
    variants: [{ price: 185000 }],
  },
  {
    id: '3', name: 'Trà Thảo Mộc Thanh Nhiệt Giải Độc Gan', slug: 'tra-thao-moc-thanh-nhiet-giai-doc-gan',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCq8eNOJpk_zNcvyS80DmlX5_zKA9TEVvNxaMLKY2cBa6GoCl0b_vnZJtU8I2nVHsECn-DX3txrdO5i1dtF_O1sTiGNtlruMkJCXTClCJL74chUSOkOp8IBMkAhgnVZoT4g2qSk4bJbrMMH_3QugJuvSpm0Zqh3-EDYGdbl_MCrgg4zvZj3ZyAr1F3b5le__kw4Vqanan9OS827YpiK5w4h-l8arj7g0Qn2zp48ylcjW_dAhz5fBw',
    category: { name: 'Tiêu Hóa' },
    variants: [{ price: 120000 }],
  },
  {
    id: '4', name: 'Dầu Xoa Bóp Thảo Dược Cốt Toái Bổ', slug: 'dau-xoa-bop-thao-duoc-cot-toai-bo',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhKAi96N07I816oqJkDFmAPHgOjHNej2a1CTUsmK0Zr9a9tOuTadzGjvKR7l0OwXs3fvGdhaP4GtRYWAwGnV5U6IdpjKXVJznFtkZFq8BXltwOhK9_T-7Y4CRYz7cdzkqTwgI_3hwH1Zti-nz3j39aD2Y924K6km8J4ePP51E6RaZxHe9uAAv0Zx7frSs4pQW1bA3j-zg0ENlnLhOqoE84TWthNkoinhNYLYAA7wEcbx1WqwEAtA',
    category: { name: 'Xương Khớp' },
    variants: [{ price: 210000, compareAtPrice: 265000 }],
  },
  {
    id: '5', name: 'Thuốc Giảm Cân Thảo Dược Tốt', slug: 'thuoc-giam-can-thao-duoc-tot',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-dK3dtBHf14BTHwAy8zLukDgPWiO8bKFfmcmyXR0FOlWUA-uwfK3kh1qdFaL-tvKpmKrRItf6MV5v0rFT4RNEMp6XReYS6kMJ05A2U0ECDJpBPnUGFggBAA2d_X-uPAwa5HrLShbsZ1Uqr8Vlv8dF7YqbhChkJ1nB2k5thQpg-T5taGjQb3jk1mgwYS9E429HsPc-mTM_ZrYvwb7VedTKiLO3ACBU0-ky1VFcHasGH6FfukbWSA',
    category: { name: 'Giảm Cân' },
    variants: [{ price: 320000 }],
  },
  {
    id: '6', name: 'Bột Sắn Dây Thải Độc Cao Cấp', slug: 'bot-san-day-thai-doc-cao-cap',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLzgM26_NNIpIj0xEpvvAgx7Nh_G-OCWBKnARUxd_XBKZCQBXdrOGtoiHA2ygxW0YkophLDxI3U4SDviJqRWrAWHxjVwINjLjOpTf7L7K7ptYq-X_eD-5rddTYCeEJjajriKz8_QkW10_bUH5BUr0AUCBu0vbcAIK2wR9EGH3fx9hWbUdzD033ADGmidl87TOkbqfAhRdirAggIz-UI9UOk7k-tcsZMQr5kdb7HUeGezIIMnYybQ',
    category: { name: 'Thải Độc' },
    variants: [{ price: 285000, compareAtPrice: 340000 }],
  },
];

const PRODUCT_BADGES: Record<string, { label: string; className: string }[]> = {
  '1': [
    { label: 'Bán chạy', className: 'bg-secondary text-white' },
    { label: '-15%', className: 'bg-error-alert text-white' },
  ],
  '2': [{ label: 'Mới về', className: 'bg-primary-container text-white' }],
  '3': [{ label: 'Bán chạy', className: 'bg-secondary text-white' }],
  '4': [{ label: '-20%', className: 'bg-error-alert text-white' }],
};

const PRODUCT_RATINGS: Record<string, number> = { '1': 4.9, '2': 4.8, '3': 5.0, '4': 4.7, '5': 4.6, '6': 4.8 };

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const displayProducts = products.length > 0 ? products : DEFAULT_PRODUCTS;
  const totalProducts = displayProducts.length;

  // Update cards per view on mount and resize
  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(4);
      }
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < Math.max(0, totalProducts - cardsPerView);

  const goPrev = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const goNext = () => {
    setCurrentIndex(Math.min(totalProducts - cardsPerView, currentIndex + 1));
  };

  // Calculate translation: each card takes 100/cardsPerView percent of the container
  const translateX = -(currentIndex * (100 / cardsPerView));

  return (
    <section className="w-full py-stack-lg bg-surface-container-low">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-12">
          <h3 className="font-headline-lg text-headline-lg text-primary mb-4">Sản Phẩm Nổi Bật</h3>
          <div className="w-20 h-1 bg-secondary mx-auto rounded-full"></div>
        </div>

        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-outline flex items-center justify-center transition-opacity ${!canGoPrev ? 'opacity-30 cursor-not-allowed' : 'hover:bg-surface-container'}`}
            aria-label="Previous products"
          >
            <span className="material-symbols-outlined text-primary">chevron_left</span>
          </button>

          <button
            onClick={goNext}
            disabled={!canGoNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-outline flex items-center justify-center transition-opacity ${!canGoNext ? 'opacity-30 cursor-not-allowed' : 'hover:bg-surface-container'}`}
            aria-label="Next products"
          >
            <span className="material-symbols-outlined text-primary">chevron_right</span>
          </button>

          {/* Carousel Container - allows natural swipe on mobile */}
          <div className="overflow-hidden mx-14">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${translateX}%)` }}
            >
              {displayProducts.map((product) => {
                const mainVariant = product.variants?.[0];
                const badges = PRODUCT_BADGES[product.id] ?? [];
                const rating = PRODUCT_RATINGS[product.id] ?? 4.5;

                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 px-2"
                  >
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-lg transition-all group relative border border-outline-variant/30 h-full flex flex-col">
                      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                        {badges.map((badge) => (
                          <span key={badge.label} className={`${badge.className} text-[10px] px-2 py-1 rounded font-bold uppercase`}>
                            {badge.label}
                          </span>
                        ))}
                      </div>

                      <Link href={`/products/${product.slug}`} className="relative mb-4 overflow-hidden rounded-md bg-surface-container h-64 block">
                        {product.thumbnailUrl && (
                          <Image
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            src={product.thumbnailUrl}
                            alt={product.name}
                            fill
                          />
                        )}
                        <AddToCartButton variantId={product.id} productName={product.name} />
                      </Link>

                      <p className="text-caption text-on-surface-variant mb-1">{product.category.name}</p>
                      <h4 className="font-label-bold text-label-bold text-primary mb-2 line-clamp-2">{product.name}</h4>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-primary font-bold">
                            {(mainVariant?.price ?? 0).toLocaleString('vi-VN')}đ
                          </span>
                          {mainVariant?.compareAtPrice && (
                            <span className="text-caption text-on-surface-variant line-through">
                              {mainVariant.compareAtPrice.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-caption font-bold">{rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}