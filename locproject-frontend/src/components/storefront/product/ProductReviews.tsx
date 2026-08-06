import { ProductDetail } from '../../../types/api.types';
import WriteReviewButton from './WriteReviewButton';

interface ReviewItem {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customer: { fullName: string };
}

interface ReviewsResponse {
    data: ReviewItem[];
    total: number;
}

async function getReviews(productId: string): Promise<ReviewsResponse> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${baseUrl}/reviews/${productId}?limit=50`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return { data: [], total: 0 };
        const json = await res.json();
        return {
            data: Array.isArray(json?.data) ? json.data : [],
            total: Number(json?.total ?? json?.data?.length ?? 0),
        };
    } catch {
        return { data: [], total: 0 };
    }
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function ProductReviews({ product }: { product: ProductDetail }) {
    const { data, total } = await getReviews(product.id);

    const avg =
        total > 0 ? data.reduce((sum, r) => sum + r.rating, 0) / data.length : 0;
    const distribution = [5, 4, 3, 2, 1].map((stars) => {
        const count = total > 0 ? data.filter((r) => r.rating === stars).length : 0;
        return {
            stars,
            count,
            percentage: total > 0 ? (count / data.length) * 100 : 0,
        };
    });

    return (
        <div className="mb-16 p-8 bg-white rounded-2xl shadow-sm border border-border">
            <h2 className="font-display font-bold text-2xl text-text-primary mb-8">
                Đánh giá từ khách hàng
            </h2>

            {total === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-text-tertiary mb-4">rate_review</span>
                    <p className="text-text-secondary font-medium">Chưa có đánh giá nào cho sản phẩm này.</p>
                    <p className="text-sm text-text-tertiary mt-1 mb-6">Hãy là người đầu tiên chia sẻ trải nghiệm của bạn.</p>
                    <WriteReviewButton />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                        {/* Rating Summary */}
                        <div className="flex flex-col items-center justify-center p-6 bg-surface-alt rounded-xl">
                            <span className="text-[48px] font-bold text-primary-700">{avg.toFixed(1)}</span>
                            <div className="flex text-secondary mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`material-symbols-outlined text-[24px] ${star <= Math.round(avg) ? 'filled-icon' : ''}`}
                                        style={star <= Math.round(avg) ? { fontVariationSettings: "'FILL' 1", color: '#f6c90e' } : { color: '#d1d5db' }}
                                    >
                                        star
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm text-text-tertiary">{total} đánh giá</span>
                        </div>

                        {/* Rating Distribution */}
                        <div className="lg:col-span-2 space-y-3">
                            {distribution.map((item) => (
                                <div key={item.stars} className="flex items-center gap-3">
                                    <span className="text-sm text-text-secondary w-10 shrink-0">
                                        {item.stars} sao
                                    </span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#f6c90e] rounded-full transition-all duration-500"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-text-tertiary w-8 text-right shrink-0">
                                        {item.count}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Review CTA (Client island) */}
                        <WriteReviewButton />
                    </div>

                    {/* Reviews */}
                    <div className="mt-12 space-y-8">
                        {data.map((review) => (
                            <div key={review.id} className="pb-8 border-b border-border/60 last:border-b-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                                            {review.customer.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text-primary">{review.customer.fullName}</p>
                                            <div className="flex text-[14px]">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span
                                                        key={star}
                                                        className={`material-symbols-outlined text-[14px] ${star <= review.rating ? 'filled-icon' : ''}`}
                                                        style={star <= review.rating ? { fontVariationSettings: "'FILL' 1", color: '#f6c90e' } : { color: '#d1d5db' }}
                                                    >
                                                        star
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-text-tertiary">{formatDate(review.createdAt)}</span>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
