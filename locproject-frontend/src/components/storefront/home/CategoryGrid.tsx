import Link from 'next/link';
import { Category } from '../../../types/api.types';

interface CategoryGridProps {
  categories: Category[];
}

const CATEGORY_ICONS: Record<string, string> = {
  'tim-mach': 'favorite',
  'ho-hap': 'air',
  'tieu-hoa': 'restaurant',
  'xuong-khop': 'accessibility_new',
  'da-lieu': 'spa',
  'than-kinh': 'psychology',
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Tim Mạch', slug: 'tim-mach' },
  { id: '2', name: 'Hô Hấp', slug: 'ho-hap' },
  { id: '3', name: 'Tiêu Hóa', slug: 'tieu-hoa' },
  { id: '4', name: 'Xương Khớp', slug: 'xuong-khop' },
  { id: '5', name: 'Da Liễu', slug: 'da-lieu' },
  { id: '6', name: 'Thần Kinh', slug: 'than-kinh' },
];

export default function CategoryGrid({ categories = DEFAULT_CATEGORIES }: CategoryGridProps) {
  return (
    <section className="w-full py-stack-lg">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-secondary font-bold text-caption uppercase tracking-widest">Danh mục</span>
            <h3 className="font-headline-lg text-headline-lg text-primary mt-2">Chọn Theo Chuyên Khoa</h3>
          </div>
          <Link className="text-primary font-label-bold text-label-bold flex items-center gap-1 hover:underline underline-offset-4" href="/products">
            Tất cả danh mục <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-10">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug}`} className="flex flex-col items-center gap-4 group cursor-pointer">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-surface-container flex items-center justify-center border-2 border-transparent group-hover:border-primary group-hover:bg-primary-fixed transition-all duration-300">
                <span className="material-symbols-outlined text-3xl md:text-4xl text-primary">
                  {CATEGORY_ICONS[category.slug] ?? 'eco'}
                </span>
              </div>
              <span className="font-label-bold text-label-bold text-on-surface text-center">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
