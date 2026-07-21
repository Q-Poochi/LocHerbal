import { ProductReview } from '../../../types/api.types';
import WriteReviewButton from './WriteReviewButton';

const MOCK_REVIEWS: ProductReview[] = [
    {
        id: 'r1',
        author: { fullName: 'Nguyễn Văn A', initials: 'NA' },
        rating: 5,
        content:
            'Sản phẩm dùng rất tốt, ông nội tôi uống được 1 tháng thấy khỏe hơn hẳn, không còn hay bị chóng mặt mỗi khi đổi thời tiết nữa. Giao hàng cực nhanh, đóng gói rất kỹ lưỡng chuyên nghiệp.',
        createdAt: '2 tuần trước',
    },
    {
        id: 'r2',
        author: { fullName: 'Trần Thị B', initials: 'TB' },
        rating: 4,
        content:
            'Tôi đã dùng được 2 tuần, thấy người nhẹ nhàng hơn. Sẽ tiếp tục dùng và đánh giá thêm.',
        createdAt: '1 tháng trước',
    },
];

const ratingDistribution = [
    { stars: 5, count: 108, percentage: 85 },
    { stars: 4, count: 15, percentage: 12 },
    { stars: 3, count: 5, percentage: 3 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
];

export default function ProductReviews() {
    return (
        <div className="mb-16 p-8 bg-surface-white rounded-2xl shadow-sm border border-outline-variant/30">
            <h2 className="font-headline-md text-headline-md text-primary font-bold mb-8">
                Đánh giá từ khách hàng
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Rating Summary */}
                <div className="flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-xl">
                    <span className="text-[48px] font-bold text-primary">4.5</span>
                    <div className="flex text-secondary mb-2">
                        {[1, 2, 3, 4].map((star) => (
                            <span key={star} className="material-symbols-outlined filled-icon" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        ))}
                        <span className="material-symbols-outlined text-[24px]">star_half</span>
                    </div>
                    <span className="text-outline text-body-sm">128 đánh giá</span>
                </div>

                {/* Rating Distribution */}
                <div className="lg:col-span-2 space-y-3">
                    {ratingDistribution.map((item) => (
                        <div key={item.stars} className="flex items-center gap-4">
                            <span className="w-12 text-body-sm font-bold">{item.stars} sao</span>
                            <div className="flex-1 h-2 bg-outline-variant rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-secondary rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                            <span className="w-12 text-body-sm text-outline">{item.count}</span>
                        </div>
                    ))}
                </div>

                {/* Review CTA (Client island) */}
                <WriteReviewButton />
            </div>

            {/* Sample Reviews */}
            <div className="mt-12 space-y-8">
                {MOCK_REVIEWS.map((review) => (
                    <div key={review.id} className="pb-8 border-b border-outline-variant/30 last:border-b-0">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {review.author.initials}
                                </div>
                                <div>
                                    <p className="font-bold text-body-md">{review.author.fullName}</p>
                                    <div className="flex text-secondary text-[14px]">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={`material-symbols-outlined text-[14px] ${star <= review.rating ? 'filled-icon' : ''}`}
                                                style={star <= review.rating ? { fontVariationSettings: "'FILL' 1" } : {}}
                                            >
                                                star
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-caption text-outline">{review.createdAt}</span>
                        </div>
                        <p className="text-body-md text-on-surface-variant">{review.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}