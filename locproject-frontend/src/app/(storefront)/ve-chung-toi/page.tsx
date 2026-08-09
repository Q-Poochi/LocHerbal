'use client';

import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import { usePublicCompanySettings } from '@/lib/hooks/useSettings';

export default function AboutPage() {
    const { data: settings } = usePublicCompanySettings();
    const companyName = settings?.companyName || 'LocHerbal';
    const tagline = settings?.tagline || 'Thảo dược thiên nhiên';
    const about =
        settings?.about ||
        'Giải pháp thảo dược hiện đại cho sức khỏe truyền thống người Việt. Chúng tôi kết hợp tinh hoa y học dân tộc với công nghệ bào chế tiên tiến, mang đến những sản phẩm an toàn, chất lượng và bền vững.';

    return (
        <>
            <Navbar />
            <main className="pb-16 md:pb-0">
                <section className="bg-gradient-to-br from-primary-50 via-white to-accent-gold-pale">
                    <div className="max-w-[850px] mx-auto px-4 md:px-10 py-16 md:py-24 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                            <span className="material-symbols-outlined text-base">eco</span>
                            {tagline}
                        </div>
                        <h1 className="font-display font-bold text-4xl md:text-5xl text-primary-700 leading-tight tracking-tight mb-6">
                            Về {companyName}
                        </h1>
                        <p className="text-text-secondary text-lg leading-relaxed">{about}</p>
                    </div>
                </section>

                <section className="max-w-[850px] mx-auto px-4 md:px-10 py-14">
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: 'verified_user', title: 'Uy tín', desc: 'Sản phẩm có nguồn gốc rõ ràng, quy trình kiểm soát chất lượng nghiêm ngặt theo tiêu chuẩn.' },
                            { icon: 'health_and_safety', title: 'An toàn', desc: 'Thành phần thiên nhiên, lành tính, an toàn cho sức khỏe người sử dụng.' },
                            { icon: 'support_agent', title: 'Đồng hành', desc: 'Đội ngũ tư vấn tận tâm, hỗ trợ khách hàng trong suốt quá trình sử dụng.' },
                        ].map((f) => (
                            <div key={f.title} className="bg-white rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                                <span className="material-symbols-outlined text-4xl text-primary mb-3">{f.icon}</span>
                                <h3 className="font-display font-semibold text-lg text-primary mb-2">{f.title}</h3>
                                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    {settings?.address && (
                        <div className="mt-12 bg-surface-alt rounded-2xl p-6 flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary">location_on</span>
                            <p className="text-text-secondary">{settings.address}</p>
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </>
    );
}