'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
    currentPage?: number;
    totalPages?: number;
}

export default function Pagination({ currentPage = 1, totalPages = 8 }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-12">
            <button
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:bg-primary hover:text-white hover:border-primary transition-all"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <button
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${currentPage === 1 ? 'bg-primary text-white font-bold' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                onClick={() => goToPage(1)}
            >
                1
            </button>

            {totalPages > 1 && (
                <button
                    className={`w-10 h-10 flex items-center justify-center rounded-lg ${currentPage === 2 ? 'bg-primary text-white font-bold' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                    onClick={() => goToPage(2)}
                >
                    2
                </button>
            )}

            {totalPages > 2 && (
                <button
                    className={`w-10 h-10 flex items-center justify-center rounded-lg ${currentPage === 3 ? 'bg-primary text-white font-bold' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                    onClick={() => goToPage(3)}
                >
                    3
                </button>
            )}

            {totalPages > 3 && (
                <span className="px-2 text-outline">...</span>
            )}

            {totalPages > 3 && (
                <button
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all"
                    onClick={() => goToPage(totalPages)}
                >
                    {totalPages}
                </button>
            )}

            <button
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-outline hover:bg-primary hover:text-white hover:border-primary transition-all"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                <span className="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
    );
}