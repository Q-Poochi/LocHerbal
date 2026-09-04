import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSessionGate from '@/components/admin/AdminSessionGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="admin-shell min-h-screen bg-background">
            <AdminSidebar />
            <main className="ml-64 min-h-screen">
                {/* Chờ phiên khôi phục xong mới render — chống race 401 khi hard-reload */}
                <AdminSessionGate>{children}</AdminSessionGate>
            </main>
        </div>
    );
}
