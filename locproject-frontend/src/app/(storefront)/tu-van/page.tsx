import Link from 'next/link';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import ConsultationForm from '@/components/storefront/home/ConsultationForm';
import {
  FadeUp,
  FadeLeft,
  FadeRight,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  TextReveal,
} from '@/components/ui/ScrollAnimations';

export const metadata = {
  title: 'Đặt lịch tư vấn - LocHerbal Apothecary',
  description:
    'Đặt lịch tư vấn sức khỏe miễn phí với đội ngũ dược sĩ LocHerbal. Tư vấn 1-1 về thảo dược, liệu trình phù hợp cho từng thể trạng.',
};

export default function TuVanPage() {
  const trustPoints = [
    {
      icon: 'schedule',
      title: 'Khung Giờ Linh Hoạt',
      desc: '08:00 - 17:30 (T2 - T7), hỗ trợ sắp xếp theo lịch hẹn riêng',
    },
    {
      icon: 'verified_user',
      title: 'Dược Sĩ Lâm Sàng 1-1',
      desc: 'Được bắt mạch thể trạng & tư vấn phác đồ dược tính an toàn',
    },
    {
      icon: 'lock',
      title: 'Bảo Mật Bệnh Án',
      desc: 'Hồ sơ sức khỏe của bạn được bảo mật tuyệt đối theo y đức',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0 bg-transparent min-h-screen">
        {/* Nền riêng trang tư vấn — overlay sage nhẹ trên BotanicalBackground */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{
            zIndex: -1,
            backgroundColor: 'transparent',
            backgroundImage:
              'radial-gradient(circle at 50% 20%, rgba(226,235,228,0.7) 0%, rgba(248,250,249,0.4) 60%, transparent 100%)',
          }}
        />

        {/* HERO SECTION */}
        <section className="w-full bg-transparent pt-14 md:pt-20 pb-8">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] text-center">
            <FadeUp>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30
                               text-secondary font-label-caps text-label-caps uppercase tracking-[0.14em] bg-white/60 backdrop-blur-md shadow-sm">
                <span className="material-symbols-outlined text-base">support_agent</span>
                Tư Vấn Miễn Phí 100% Cùng Dược Sĩ
              </span>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 className="text-display-lg md:text-headline-xl text-primary mt-6 leading-[1.08] tracking-[-0.03em] font-display font-bold">
                <TextReveal text="Đặt Lịch Tư Vấn Thảo Dược Cá Nhân Hóa" />
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-5 max-w-2xl mx-auto leading-relaxed">
                Chuyên gia dược học LocHerbal sẽ liên hệ lại với bạn trong vòng <strong>15 phút</strong> để
                thấu hiểu thể trạng và đề xuất phác đồ thảo mộc chuẩn hóa khoa học, an lành nhất.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* TRUST STRIP SECTION (STAGGER) */}
        <section className="w-full py-6 md:py-8 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {trustPoints.map((s) => (
                <StaggerItem key={s.title}>
                  <div className="h-full p-6 rounded-3xl bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/40 shadow-botanical flex items-center gap-4 hover:border-primary/40 transition-all">
                    <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                      <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                    </span>
                    <div className="text-left">
                      <p className="font-headline-sm text-base text-primary font-bold">{s.title}</p>
                      <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* CONSULTATION FORM WITH GLASS CONTAINER */}
        <section className="w-full py-6">
          <div className="mx-auto max-w-[1000px] px-margin-mobile md:px-6">
            <ScaleIn delay={0.1}>
              <div className="rounded-3xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/50 shadow-botanical overflow-hidden p-2 sm:p-6 md:p-8">
                <ConsultationForm showHeader={false} />
              </div>
            </ScaleIn>
          </div>
        </section>

        {/* CTA EXPLORE PRODUCTS */}
        <section className="w-full py-16 md:py-24 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] text-center">
            <FadeUp>
              <span className="font-label-caps text-xs text-secondary uppercase tracking-widest font-semibold">
                Khám Phá Dược Liệu Thuần Khiết
              </span>
              <h2 className="font-headline-lg text-2xl md:text-4xl text-primary font-bold mt-2">
                Chưa biết bắt đầu từ dòng sản phẩm nào?
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 max-w-xl mx-auto leading-relaxed">
                Tham khảo ngay danh mục dược liệu tuyển chọn chuẩn GMP hoặc đăng ký để nhận phác đồ dùng thử phù hợp từ chuyên gia.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full
                             bg-primary text-white font-label-caps text-label-caps uppercase
                             tracking-[0.1em] hover:bg-primary/90 hover:scale-105 shadow-md transition-all duration-300 font-semibold"
                >
                  Khám phá sản phẩm <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link
                  href="/ve-chung-toi"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full
                             bg-white/80 border border-outline-variant/60 text-primary font-label-caps text-label-caps uppercase
                             tracking-[0.1em] hover:bg-white transition-all duration-300 font-semibold shadow-sm"
                >
                  Tìm hiểu nguồn gốc dược liệu
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
