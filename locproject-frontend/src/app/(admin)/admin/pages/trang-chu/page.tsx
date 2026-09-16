import PageBlocksAdmin from '@/components/admin/pages/PageBlocksAdmin';

export const metadata = {
    title: 'Quản lý trang: Trang chủ',
};

export default function TrangChuAdminPage() {
    return <PageBlocksAdmin pageSlug="home" pageTitle="Trang: Trang chủ (Home)" />;
}
