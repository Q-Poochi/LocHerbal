'use client';

import Image from 'next/image';

interface CartItemProps {
    id: string;
    name: string;
    variant: string;
    price: number;
    quantity: number;
    thumbnail: string;
    inStock: boolean;
    onQuantityChange: (quantity: number) => void;
    onRemove: () => void;
}

export default function CartItem({
    id,
    name,
    variant,
    price,
    quantity,
    thumbnail,
    inStock,
    onQuantityChange,
    onRemove,
}: CartItemProps) {
    const subtotal = Number(price ?? 0) * quantity;

    return (
        <div
            className={`bg-surface-white p-4 rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] flex flex-col sm:flex-row items-center gap-4 border border-outline-variant/30 ${!inStock ? 'opacity-90' : ''
                }`}
        >
            <div className="w-24 h-24 flex-shrink-0 bg-surface-container rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    className="w-full h-full object-cover"
                    src={thumbnail}
                    alt={name}
                />
            </div>

            <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between w-full">
                <div className="mb-2 md:mb-0">
                    <h3 className="font-label-bold text-label-bold text-primary">{name}</h3>
                    <p className="text-body-sm text-on-surface-variant">{variant}</p>
                    <p className="text-body-sm text-primary font-semibold mt-1">
                        {Number(price ?? 0).toLocaleString('vi-VN')}đ
                    </p>
                    {!inStock && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded uppercase">
                            Hết hàng / Vượt quá tồn kho
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-8">
                    <div
                        className={`flex items-center border rounded-lg overflow-hidden ${!inStock ? 'border-error-alert' : 'border-outline-variant'
                            }`}
                    >
                        <button
                            className="px-3 py-1 hover:bg-surface-container transition-colors"
                            onClick={() => onQuantityChange(quantity - 1)}
                            disabled={quantity <= 1}
                        >
                            -
                        </button>
                        <input
                            className="w-12 text-center border-none focus:ring-0 font-body-md"
                            type="number"
                            value={quantity}
                            readOnly
                        />
                        <button
                            className="px-3 py-1 hover:bg-surface-container transition-colors"
                            onClick={() => onQuantityChange(quantity + 1)}
                            disabled={!inStock}
                        >
                            +
                        </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                        <p className="font-label-bold text-label-bold text-primary">
                            {Number(subtotal).toLocaleString('vi-VN')}đ
                        </p>
                    </div>

                    <button
                        className="material-symbols-outlined text-outline hover:text-error transition-colors cursor-pointer"
                        onClick={onRemove}
                    >
                        delete
                    </button>
                </div>
            </div>
        </div>
    );
}
