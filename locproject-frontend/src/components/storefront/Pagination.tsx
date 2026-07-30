'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  totalPages?: number;
}

export default function Pagination({ totalPages = 1 }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);

    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (totalPages <= 1) return null;

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 2;

    pages.push(1);

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    if (rangeStart > 2) pages.push('ellipsis');

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) pages.push('ellipsis');

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center gap-1.5 mt-12">
      {/* Previous */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-text-secondary
                   hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all duration-150
                   disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        <span className="material-symbols-outlined text-base">chevron_left</span>
      </button>

      {/* Pages */}
      {visiblePages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="w-8 h-10 flex items-center justify-center text-text-tertiary select-none">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-150
              ${currentPage === page
                ? 'bg-primary-700 text-white shadow-sm'
                : 'text-text-secondary hover:bg-primary-50 hover:text-primary-700'
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-text-secondary
                   hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all duration-150
                   disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        <span className="material-symbols-outlined text-base">chevron_right</span>
      </button>
    </div>
  );
}
