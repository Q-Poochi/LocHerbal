import PageBlocksAdmin from '@/components/admin/pages/PageBlocksAdmin';

export const metadata = {
    title: 'Quản lý trang: Về chúng tôi',
};

export default function VeChungToiAdminPage() {
    return <PageBlocksAdmin pageSlug="about-us" pageTitle="Trang: Về chúng tôi" />;
}