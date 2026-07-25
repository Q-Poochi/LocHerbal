'use client';

import { useAddToCart } from '@/lib/hooks/useProducts';
import { useToast } from '@/lib/providers/toast-provider';

interface AddToCartButtonProps {
  variantId: string;
  productName: string;
}

export default function AddToCartButton({ variantId, productName }: AddToCartButtonProps) {
  const addToCartMutation = useAddToCart();
  const toast = useToast();

  const handleClick = () => {
    addToCartMutation.mutate(
      { productVariantId: variantId, qty: 1 },
      {
        onSuccess: () => {
          toast.success(`Đã thêm "${productName}" vào giỏ hàng`);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Thêm vào giỏ thất bại';
          toast.error(msg);
        },
      },
    );
  };

  return (
    <button
      className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50"
      onClick={handleClick}
      disabled={addToCartMutation.isPending}
    >
      <span className="material-symbols-outlined">add_shopping_cart</span>
    </button>
  );
}
