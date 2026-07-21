'use client';

interface AddToCartButtonProps {
  variantId: string;
  productName: string;
}

export default function AddToCartButton({ variantId, productName }: AddToCartButtonProps) {
  const handleClick = () => {
    // TODO: connect API POST /cart/items
    console.log('Add to cart:', variantId, productName);
  };

  return (
    <button
      className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
      onClick={handleClick}
    >
      <span className="material-symbols-outlined">add_shopping_cart</span>
    </button>
  );
}
