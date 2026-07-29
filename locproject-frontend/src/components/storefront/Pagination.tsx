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
        <div className="flex items-center justify-center gap-2 mt-12">
            <button
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#c1c8c2] text-[#414844] hover:bg-[#f0eee8] hover:border-[#1b4332] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <span className="material-symbols-outlined">chevron_left</span>
            </button>

            {visiblePages.map((page, idx) =>
                page === 'ellipsis' ? (
                    <span key={`e${idx}`} className="w-10 h-10 flex items-center justify-center text-[#c1c8c2] select-none">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                            currentPage === page
                                ? 'bg-[#012d1d] text-white font-bold'
                                : 'border border-[#c1c8c2] text-[#414844] hover:bg-[#f0eee8] hover:border-[#1b4332]'
                        }`}
                        onClick={() => goToPage(page)}
                    >
                        {page}
                    </button>
                ),
            )}

            <button
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#c1c8c2] text-[#414844] hover:bg-[#f0eee8] hover:border-[#1b4332] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                <span className="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
    );
}
