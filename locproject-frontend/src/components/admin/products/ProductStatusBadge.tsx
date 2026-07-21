interface ProductStatusBadgeProps {
    status: 'published' | 'draft';
}

export default function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
    if (status === 'published') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-success-leaf/10 text-success-leaf text-[12px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-success-leaf" />
                Công bố
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-outline-variant/30 text-on-surface-variant text-[12px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
            Bản nháp
        </span>
    );
}