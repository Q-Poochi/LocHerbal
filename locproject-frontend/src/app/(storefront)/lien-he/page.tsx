'use client';

import Link from 'next/link';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import { usePublicCompanySettings } from '@/lib/hooks/useSettings';

export default function ContactPage() {
    const { data: settings } = usePublicCompanySettings();

    const contacts: Array<{ icon: string; label: string; value?: string | null; href?: string }> = [
        { icon: 'support_agent', label: 'Hotline', value: settings?.hotline, href: settings?.hotline ? `tel:${settings.hotline}` : undefined },
        { icon: 'mail', label: 'Email', value: settings?.email, href: settings?.email ? `mailto:${settings.email}` : undefined },
        { icon: 'location_on', label: 'Địa chỉ', value: settings?.address },
        { icon: 'schedule', label: 'Giờ làm việc', value: settings?.workingHours },
    ];

    return (
        <>
            <Navbar />
            <main className="pb-16 md:pb-0">
                <section className="bg-gradient-to-br from-primary-50 via-white to-accent-gold-pale">
                    <div className="max-w-[850px] mx-auto px-4 md:px-10 py-16 md:py-24 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                            <span className="material-symbols-outlined text-base">support_agent</span>
                            Chúng tôi luôn sẵn sàng hỗ trợ
                        </div>
                        <h1 className="font-display font-bold text-4xl md:text-5xl text-primary-700 leading-tight tracking-tight mb-6">
                            Liên hệ với {settings?.companyName || 'LocHerbal'}
                        </h1>
                        <p className="text-text-secondary text-lg leading-relaxed">
                            Mọi thắc mắc về sản phẩm, đơn hàng hay chương trình ưu đãi, vui lòng liên hệ với chúng tôi qua các kênh dưới đây.
                        </p>
                    </div>
                </section>

                <section className="max-w-[850px] mx-auto px-4 md:px-10 py-14">
                    <div className="grid md:grid-cols-2 gap-6">
                        {contacts.flatMap((contact) =>
                            contact.value ? (
                                <div key={contact.label} className="bg-white rounded-2xl border border-border p-6 flex items-start gap-4 hover:shadow-lg transition-shadow">
                                    <span className="material-symbols-outlined text-3xl text-primary">{contact.icon}</span>
                                    <div>
                                        <p className="text-sm text-text-tertiary">{contact.label}</p>
                                        {contact.href ? (
                                            <Link href={contact.href} className="text-primary font-semibold text-lg hover:underline break-words">
                                                {contact.value}
                                            </Link>
                                        ) : (
                                            <p className="text-primary font-semibold text-lg break-words whitespace-pre-line">{contact.value}</p>
                                        )}
                                    </div>
                                </div>
                            ) : null,
                        )}
                    </div>
                    <div className="mt-8 bg-white rounded-2xl border border-border p-6 flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary">handshake</span>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Hoặc liên hệ qua các kênh mạng xã hội:{' '}
                            {[
                                { label: 'Facebook', href: settings?.facebookUrl },
                                { label: 'YouTube', href: settings?.youtubeUrl },
                                { label: 'Zalo', href: settings?.zaloUrl },
                            ]
                                .filter((s): s is { label: string; href: string } => !!s.href)
                                .map((s) => (
                                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">
                                        {s.label}
                                    </a>
                                ))
                                .reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ', ', el]), [])}
                        </p>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}