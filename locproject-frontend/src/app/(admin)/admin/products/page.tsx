import Link from 'next/link';
import ProductsTable from '@/components/admin/products/ProductsTable';

export default function AdminProductsPage() {
    return (
        <div className="p-8 max-w-container-max mx-auto w-full">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-2">
                        <span>Sản phẩm</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary font-semibold">Danh sách</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý sản phẩm</h2>
                </div>
                <Link
                    href="/admin/products/new"
                    className="bg-primary-container text-white px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">add_box</span>
                    Thêm sản phẩm mới
                </Link>
            </div>

            {/* Product Table */}
            <ProductsTable />
        </div>
    );
}