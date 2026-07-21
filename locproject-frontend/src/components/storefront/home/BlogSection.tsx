import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '../../../types/api.types';

interface BlogSectionProps {
  posts: BlogPost[];
}

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: '1',
    title: '5 Loại Thảo Dược Hỗ Trợ Giấc Ngủ Ngon Tự Nhiên',
    slug: '5-loai-thao-duoc-ho-tro-giac-ngu-ngon-tu-nhien',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtfdM-3viJXkUZqNopEBCgBX-9qA92wHlQvqVjyExdNh_c1KPcQKhpnZefcfvWs79C2eo93GnF1H5rcrHPKo6prbKRl3DYuAg6d5MeV5YC-cAs2urWQRJz-tOHlmFpWzxrg0_3x-t-NENahHDt-dAo1RBDLSsMXOKeOqFmHBkTMoTcfZ9cGXNczlB4Pv4116u6DrUQH-unbvzbYWLRY0MVGxD0Qe0-G-W1o5U139vvu2yTC6DAsg',
    publishedAt: '2024-01-15',
    author: { fullName: 'BS. Nguyễn Minh Tuấn' },
  },
  {
    id: '2',
    title: 'Tăng Cường Đề Kháng Mùa Giao Mùa Với Gừng Và Tỏi',
    slug: 'tang-cuong-de-khang-mua-giao-mua-voi-gung-va-toi',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmKOLzAuUK1O6u8X-VVZqZYRN0xcM3V3cdNgTcqq8KDnMo9qaDO18w_tKthLpVatiKvKSlXiwd1qXDcn2JTTtLoEi44W_J60YSjdxuHno0oQ44vhP-PA6RUbR3pv40V7qGrmdhct8ctQEHU8Iwi38D1f8VTq5qo4Psrni3RJIOq6N7pnxBA_6Tj35ICqoTJM24ZdEBJipajuISWqp_LB9KRFuE006xWeOi0-9ha_fMji4hyUcfMw',
    publishedAt: '2024-01-10',
    author: { fullName: 'DS. Lê Thị Hương' },
  },
  {
    id: '3',
    title: 'Quy Trình Chiết Xuất Thảo Dược Đạt Chuẩn GMP Tại LocHerbal',
    slug: 'quy-trinh-chiet-xuat-thao-duoc-dat-chuan-gmp-tai-locherbal',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-ES64muZQ0LRK6ARMucISfHzL45qTK7tY0El70I0cpFXp8kS4Fvr6x0vaMdPpVgeGzeuZtWy9FNajxbAvUPYRaZdvVaI0jSSE9sl7dpO6ygnVrzz6QlPvEpW8I0_fAwQkFEcKqsveJuAIj89UARreTs6FXIjzcypFZ5WytYLAKAF1081Fe7uC1AspY8wOQptB7S4gqbGlbiR413s6EDL0YGGNvrsRLdEUxEKSOWc4Btq3kOy4qg',
    publishedAt: '2024-01-05',
    author: { fullName: 'LocHerbal Editorial' },
  },
];

const POST_TAGS: Record<string, string> = {
  '1': 'Y học cổ truyền',
  '2': 'Dinh dưỡng',
  '3': 'Tin tức',
};

const POST_READ_TIMES: Record<string, string> = {
  '1': '5 phút đọc',
  '2': '8 phút đọc',
  '3': '10 phút đọc',
};

const POST_DESCRIPTIONS: Record<string, string> = {
  '1': 'Mất ngủ là tình trạng phổ biến trong xã hội hiện đại. Hãy cùng LocHerbal khám phá các bài thuốc từ tâm sen, táo nhân...',
  '2': 'Không chỉ là gia vị, gừng và tỏi còn là những vị thuốc quý giúp bảo vệ cơ thể khỏi virus và vi khuẩn tấn công...',
  '3': 'Để đảm bảo dược tính tối ưu, mọi sản phẩm của chúng tôi đều trải qua quy trình kiểm soát chất lượng nghiêm ngặt...',
};

export default function BlogSection({ posts = DEFAULT_POSTS }: BlogSectionProps) {
  return (
    <section className="w-full py-stack-lg bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h3 className="font-headline-lg text-headline-lg text-primary">Kiến Thức Sức Khỏe</h3>
            <p className="text-on-surface-variant mt-2">Cập nhật tin tức y học và thảo dược mới nhất</p>
          </div>
          <button className="text-primary font-label-bold text-label-bold hover:underline">
            {/* TODO: connect route /blog */}
            Xem thêm bài viết
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="h-48 overflow-hidden">
                {post.thumbnailUrl && (
                  <Image
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={post.thumbnailUrl}
                    alt={post.title}
                    width={400}
                    height={192}
                  />
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-primary-container/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    {POST_TAGS[post.id] ?? 'Sức khỏe'}
                  </span>
                  <span className="text-caption text-on-surface-variant">{POST_READ_TIMES[post.id] ?? '5 phút đọc'}</span>
                </div>
                <h4 className="font-headline-md text-body-lg font-bold text-primary mb-3 group-hover:text-secondary transition-colors">{post.title}</h4>
                <p className="text-body-sm text-on-surface-variant line-clamp-3 mb-4">{POST_DESCRIPTIONS[post.id] ?? ''}</p>
                <Link className="text-primary font-bold text-caption flex items-center gap-2 group/link" href={`/blog/${post.slug}`}>
                  Đọc tiếp <span className="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">chevron_right</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
