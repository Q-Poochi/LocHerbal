'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BannerForm from '@/components/admin/banners/BannerForm';
import { useAdminBanners } from '@/lib/hooks/useMarketing';
import { getErrorMessage } from '@/lib/utils/error';

export default function EditBannerPage() {
    const params = useParams<{ id: string }>();
    const { data: banners = [], isLoading, error } = useAdminBanners();
    const [banner, setBanner] = useState<import('@/lib/hooks/useMarketing').AdminBanner | undefined>(undefined);

    useEffect(() => {
        setBanner(banners.find((b) => b.id === params.id));
    }, [banners, params.id]);

    if (isLoading) {
        return <p className="text-on-surface-variant">Đang tải...</p>;
    }

    if (error) {
        return <p className="text-error">{getErrorMessage(error, 'Không thể tải banner')}</p>;
    }

    if (!banner) {
        return (
            <div className="text-center py-20">
                <p className="text-on-surface-variant mb-4">Không tìm thấy banner.</p>
            </div>
        );
    }

    return <BannerForm banner={banner} />;
}