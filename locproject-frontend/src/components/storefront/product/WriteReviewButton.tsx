'use client';

export default function WriteReviewButton() {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-body-sm text-on-surface-variant px-4">
                Bạn đã sử dụng sản phẩm này?
            </p>
            <button
                type="button"
                className="w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
            >
                Viết đánh giá
            </button>
        </div>
    );
}