'use client';

import Link from 'next/link';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import { usePublicCompanySettings } from '@/lib/hooks/useSettings';
import {
  FadeUp,
  FadeLeft,
  FadeRight,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  TextReveal,
} from '@/components/ui/ScrollAnimations';

export default function ContactPage() {
  const { data: settings } = usePublicCompanySettings();

  const contacts: Array<{
    icon: string;
    label: string;
    subLabel: string;
    value?: string | null;
    href?: string;
    actionText: string;
  }> = [
    {
      icon: 'support_agent',
      label: 'Hotline Chăm Sóc',
      subLabel: 'Hỗ trợ tư vấn chuyên môn 24/7',
      value: settings?.hotline,
      href: settings?.hotline ? `tel:${settings.hotline}` : undefined,
      actionText: 'Gọi ngay',
    },
    {
      icon: 'mail',
      label: 'Email Hỗ Trợ',
      subLabel: 'Phản hồi trong vòng 2 giờ làm việc',
      value: settings?.email,
      href: settings?.email ? `mailto:${settings.email}` : undefined,
      actionText: 'Gửi thư',
    },
    {
      icon: 'location_on',
      label: 'Trụ Sở & Vườn Dược',
      subLabel: 'Không gian trải nghiệm & bào chế',
      value: settings?.address,
      actionText: 'Xem bản đồ',
    },
    {
      icon: 'schedule',
      label: 'Khung Giờ Phục Vụ',
      subLabel: 'Tất cả các ngày trong tuần',
      value: settings?.workingHours || '08:00 - 18:00 (Thứ 2 - Thứ 7)',
      actionText: 'Lịch hoạt động',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pb-20 md:pb-24 bg-transparent min-h-screen">
        {/* HERO SECTION */}
        <section className="relative pt-16 md:pt-24 pb-12 overflow-hidden">
          <div className="max-w-[960px] mx-auto px-4 md:px-8 text-center relative z-10">
            <FadeUp>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30 text-secondary font-label-caps text-xs uppercase tracking-[0.14em] bg-white/60 backdrop-blur-md shadow-sm">
                <span className="material-symbols-outlined text-base">support_agent</span>
                Kết nối cùng dược sĩ LocHerbal
              </span>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-primary mt-6 leading-tight tracking-tight">
                <TextReveal text={`Liên hệ với ${settings?.companyName || 'LocHerbal Apothecary'}`} />
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-5 max-w-2xl mx-auto leading-relaxed">
                Mọi thắc mắc về thể trạng, liều lượng thảo dược hay đơn hàng, đội ngũ dược sĩ chuyên khoa của chúng tôi luôn sẵn sàng lắng nghe và đồng hành tận tâm cùng bạn.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* CONTACT CARDS GRID */}
        <section className="max-w-[1100px] mx-auto px-4 md:px-8 py-6">
          <StaggerContainer className="grid sm:grid-cols-2 gap-6 md:gap-8">
            {contacts.map((contact) =>
              contact.value ? (
                <StaggerItem key={contact.label}>
                  <div className="h-full bg-surface-container-lowest/85 backdrop-blur-md rounded-3xl p-7 md:p-8 border border-outline-variant/50 shadow-botanical hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                        <span className="material-symbols-outlined text-3xl">{contact.icon}</span>
                      </div>
                      <span className="font-label-caps text-xs text-secondary font-bold uppercase tracking-wider">
                        {contact.label}
                      </span>
                      <p className="text-xs text-on-surface-variant/80 mt-1 mb-3">
                        {contact.subLabel}
                      </p>
                      {contact.href ? (
                        <Link
                          href={contact.href}
                          className="font-headline-md text-xl md:text-2xl text-primary font-bold hover:underline break-words block"
                        >
                          {contact.value}
                        </Link>
                      ) : (
                        <p className="font-headline-md text-lg md:text-xl text-on-surface font-semibold break-words whitespace-pre-line leading-snug">
                          {contact.value}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>{contact.actionText}</span>
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </StaggerItem>
              ) : null
            )}
          </StaggerContainer>

          {/* SOCIAL CHANNELS & QUICK ACTION */}
          <FadeUp delay={0.3}>
            <div className="mt-8 md:mt-10 p-6 md:p-8 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 shadow-botanical flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">forum</span>
                </div>
                <div>
                  <h3 className="font-label-lg text-on-surface font-bold text-base">Kênh Cộng Đồng & Trực Tuyến</h3>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                    Theo dõi các bài chia sẻ dưỡng sinh và nhận tư vấn nhanh qua mạng xã hội
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap justify-center">
                {[
                  { label: 'Facebook Page', href: settings?.facebookUrl, icon: 'public' },
                  { label: 'Kênh YouTube', href: settings?.youtubeUrl, icon: 'smart_display' },
                  { label: 'Zalo Official', href: settings?.zaloUrl, icon: 'chat' },
                ]
                  .filter((s): s is { label: string; href: string; icon: string } => !!s.href)
                  .map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-outline-variant/60 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all text-xs font-semibold shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">{s.icon}</span>
                      {s.label}
                    </a>
                  ))}
                <Link
                  href="/tu-van"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-all text-xs font-semibold shadow-md"
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  Đặt Lịch Tư Vấn 1-1
                </Link>
              </div>
            </div>
          </FadeUp>
        </section>
      </main>
      <Footer />
    </>
  );
}
