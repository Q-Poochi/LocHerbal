'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { wishlistApi } from '@/lib/api/client';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';

interface WishlistItem {
  id: string;
  variant: {
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
      thumbnailUrl: string | null;
    };
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace('/login?redirect=/wishlist');
      return;
    }
    if (!hasHydrated) return;

    const fetchItems = async () => {
      try {
        const data = await wishlistApi.getItems();
        setItems(data);
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
      }
    };

    if (hasHydrated && user) {
      fetchItems();
    }
  }, [user, hasHydrated]);

  const handleRemove = async (productVariantId: string) => {
    if (!confirm('Are you sure you want to remove this product from your wishlist?')) {
      return;
    }

    try {
      await fetch(`/api/wishlist/${encodeURIComponent(productVariantId)}`, {
        method: 'DELETE',
      });
      const data = await fetch('/api/wishlist').then(r => r.json());
      setItems(data);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      alert('Cannot remove product. Please try again.');
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-primary-300 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-primary mb-2">Chua co danh sach yeu thich</h1>
          <p className="text-sm text-text-secondary mb-6">Dang nhap de luu va quan ly san pham yeu thich cua ban</p>
          <Link
            href="/login?redirect=/wishlist"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-700 text-white font-semibold hover:bg-primary-800"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            Dang nhap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface-bg">
        <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
              Danh sach yeu thich
            </h1>
            <span className="text-sm text-text-secondary">{items.length} san pham</span>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-primary-300 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
              <h2 className="font-display font-bold text-xl text-text-primary mb-2">Danh sach yeu thich trong</h2>
              <p className="text-sm text-text-secondary mb-6">Hay them san pham vao day de de dang mua sau nhe!</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-700 text-white font-semibold hover:bg-primary-800"
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                Mua sam ngay
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.variant.product.slug}`}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-lg hover:border-primary-200 transition-all duration-300"
                  >
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                      {item.variant.product.thumbnailUrl ? (
                        <img
                          src={item.variant.product.thumbnailUrl}
                          alt={item.variant.product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                          <span className="material-symbols-outlined text-primary-300 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-red-500">delete</span>
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-text-primary line-clamp-2 mb-1">{item.variant.product.name}</h3>
                      <p className="text-sm text-text-secondary mt-1 line-clamp-1">{item.variant.product.slug}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {items.length >= 20 && (
                <div className="text-center mt-8">
                  <button className="px-6 py-3 rounded-full border border-border text-sm font-medium text-text-secondary hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-colors">
                    Xem them
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

interface WishlistItem {
  id: string;
  variant: {
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
      thumbnailUrl: string | null;
    };
  };
}