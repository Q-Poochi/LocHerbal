'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, useUpdateCartItem, useRemoveFromCart } from '../../lib/hooks/useProducts';
import { useCartStore } from '../../lib/store/cart.store';
import { useToast } from '../../lib/providers/toast-provider';
import { useAuthStore } from '../../lib/store/auth.store';
import { resolveCartItemImage } from '../../lib/utils/imageUrl';
import type { CartItem } from '@/types/api.types';

const FREE_SHIP_THRESHOLD = 500000;

export default function CartDrawer() {
  const { data: cart, isLoading, error } = useCart();
  const updateQuantityMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveFromCart();

  const router = useRouter();
  const { user } = useAuthStore();
  const toast = useToast();

  const { isDrawerOpen, closeDrawer } = useCartStore();

  /* Close drawer on Escape press */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    if (isDrawerOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // lock scroll
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, closeDrawer]);

  const items = Array.isArray(cart?.items) ? cart.items : [];

  const subtotal = items.reduce(
    (sum: number, item: CartItem) => sum + Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty,
    0
  );

  const progress = Math.min((subtotal / FREE_SHIP_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIP_THRESHOLD - subtotal;

  const updateQuantity = (variantId: string, qty: number) => {
    if (qty < 1) return;
    updateQuantityMutation.mutate(
      { variantId, qty },
      { onError: () => toast.error('Cập nhật số lượng thất bại') }
    );
  };

  const removeItem = (variantId: string) => {
    removeItemMutation.mutate(variantId, {
      onSuccess: () => toast.success('Đã xóa sản phẩm khỏi giỏ hàng'),
      onError: () => toast.error('Xóa sản phẩm thất bại'),
    });
  };

  const handleCheckout = () => {
    closeDrawer();
    if (!user) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div
      className={`fixed inset-0 z-[150] transition-opacity duration-300
        ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!isDrawerOpen}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer panel — full-screen on mobile, 420px sidebar on md+ */}
      <div
        className={`absolute bg-white shadow-xl flex flex-col
                    transition-transform duration-300 ease-in-out
                    /* mobile: slide up from bottom, full width */
                    bottom-0 left-0 right-0 h-[92dvh] rounded-t-3xl
                    md:top-0 md:bottom-auto md:left-auto md:right-0 md:h-full md:w-full md:max-w-[420px] md:rounded-none
                    ${isDrawerOpen
                      ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
                      : 'translate-y-full md:translate-y-0 md:translate-x-full'
                    }`}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-700">shopping_bag</span>
            <h2 className="font-display font-bold text-lg text-text-primary">
              Giỏ hàng của bạn {items.length > 0 && `(${items.length})`}
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            <span className="material-symbols-outlined text-text-secondary text-2xl">close</span>
          </button>
        </div>

        {/* Free ship progress bar */}
        {items.length > 0 && (
          <div className="p-4 bg-primary-50/50 border-b border-border space-y-2">
            {remaining > 0 ? (
              <p className="text-xs text-text-secondary">
                Mua thêm <strong>{remaining.toLocaleString('vi-VN')}đ</strong> để được <strong>miễn phí ship</strong>!
              </p>
            ) : (
              <p className="text-xs text-primary-700 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">celebration</span>
                Bạn đã được miễn phí vận chuyển!
              </p>
            )}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
              <p className="text-sm text-text-secondary">Không thể tải giỏ hàng</p>
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="text-center py-20 animate-scale-in">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">shopping_cart</span>
              <p className="text-text-secondary text-sm font-medium mb-5">Giỏ hàng trống</p>
              <button
                onClick={closeDrawer}
                className="px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm rounded-full transition-all"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          )}

          {!isLoading && !error && items.map((item: CartItem, idx: number) => {
            const price = Number(item.priceSnapshot ?? item.unitPrice ?? 0);
            return (
              <div
                key={item.id ?? item.productVariantId ?? idx}
                data-testid={`cart-item-${item.productVariantId ?? idx}`}
                className="flex items-start gap-3 py-3 border-b border-border last:border-0"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-surface-alt flex-shrink-0 overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveCartItemImage(item) || '/placeholder.png'}
                    className="w-full h-full object-cover"
                    alt={item.productNameSnapshot ?? 'Sản phẩm'}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary text-sm leading-tight truncate">
                    {item.productNameSnapshot ?? 'Sản phẩm'}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                    {item.variantName ?? item.skuSnapshot}
                  </p>
                  <p className="text-primary-700 font-bold text-xs mt-1">
                    {price.toLocaleString('vi-VN')}đ
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center border border-border rounded-lg overflow-hidden w-24 h-7 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productVariantId, item.qty - 1)}
                      disabled={updateQuantityMutation.isPending}
                      className="w-7 h-full flex items-center justify-center text-primary hover:bg-gray-100 font-bold disabled:opacity-50"
                      aria-label={`Giảm số lượng ${item.productNameSnapshot ?? 'sản phẩm'}`}
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-xs font-semibold text-text-primary">{item.qty}</span>
                    <button
                      onClick={() => updateQuantity(item.productVariantId, item.qty + 1)}
                      disabled={updateQuantityMutation.isPending}
                      className="w-7 h-full flex items-center justify-center text-primary hover:bg-gray-100 font-bold disabled:opacity-50"
                      aria-label={`Tăng số lượng ${item.productNameSnapshot ?? 'sản phẩm'}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total + Delete */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-primary-700 text-sm">
                    {(price * item.qty).toLocaleString('vi-VN')}đ
                  </p>
                  <button
                    onClick={() => removeItem(item.productVariantId)}
                    disabled={removeItemMutation.isPending}
                    className="mt-2 text-error hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                    aria-label="Xóa sản phẩm"
                  >
                    <span className="material-symbols-outlined text-base leading-none">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-surface-alt space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-text-secondary font-medium">Tạm tính:</span>
              <span className="text-lg font-bold text-primary-700">
                {subtotal.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="py-3 px-4 rounded-xl border border-primary-700 text-primary-700 font-semibold text-center
                           text-xs hover:bg-primary-50 transition-all active:scale-95 shadow-sm"
              >
                Xem giỏ hàng
              </Link>
              <button
                onClick={handleCheckout}
                data-testid="cart-drawer-checkout-btn"
                className="py-3 px-4 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-semibold
                           text-xs hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                Thanh toán
                <span className="material-symbols-outlined text-xs leading-none">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
