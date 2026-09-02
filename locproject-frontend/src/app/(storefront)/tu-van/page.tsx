import Link from 'next/link';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import ConsultationForm from '@/components/storefront/home/ConsultationForm';

export const metadata = {
  title: 'Đặt lịch tư vấn - LocHerbal Apothecary',
  description:
    'Đặt lịch tư vấn sức khỏe miễn phí với đội ngũ dược sĩ LocHerbal. Tư vấn 1-1 về thảo dược, liệu trình phù hợp cho từng thể trạng.',
};

export default function TuVanPage() {
  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">
        {/* Nền riêng trang tư vấn — ảnh lá & viên nang thảo dược (tu-van.jpg) dưới dạng
            CSS layer fixed: overlay sage sáng đè lên ảnh để chữ vẫn dễ đọc.
            z-index -1 để ảnh nằm DƯỚI toàn bộ nội dung (z-0 positioned sẽ vẽ đè lên
            section thường — bug đã gặp), nhưng vẫn trên BotanicalBackground toàn cục */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{
            zIndex: -1,
            backgroundColor: '#f8faf9',
            backgroundImage:
              'linear-gradient(180deg, rgba(248,250,249,0.86) 0%, rgba(222,232,224,0.55) 45%, rgba(248,250,249,0.90) 100%), url(/images/decor/tu-van.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Hero */}
        <section className="w-full bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] py-16 md:py-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tertiary/40
                             text-tertiary font-label-caps text-label-caps uppercase tracking-[0.1em] bg-white/40">
              <span className="material-symbols-outlined text-base">support_agent</span>
              Hoàn toàn miễn phí
            </span>
            <h1 className="text-display-lg md:text-headline-xl text-primary mt-5 leading-[1.1] tracking-[-0.02em] font-display font-bold">
              Đặt Lịch Tư Vấn Sức Khỏe
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-5 max-w-2xl mx-auto">
              Chuyên gia của chúng tôi sẽ liên hệ với bạn trong vòng <strong>15 phút</strong> để
              tư vấn giải pháp phù hợp nhất từ tinh hoa thảo mộc Việt, chuẩn khoa học hiện đại.
            </p>
          </div>
        </section>

        {/* Trust strip */}
        <section className="w-full py-8 bg-white/40 border-y border-outline-variant/40">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { icon: 'schedule', title: 'T2 - T7', desc: '08:00 - 17:30, Chủ nhật nghỉ' },
                { icon: 'support_agent', title: 'Dược sĩ chuyên môn', desc: 'Tư vấn 1-1 theo đúng thể trạng' },
                { icon: 'lock', title: 'Bảo mật tuyệt đối', desc: 'Thông tin của bạn được bảo mật hoàn toàn' },
              ].map((s) => (
                <div key={s.title} className="flex items-center justify-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                  </span>
                  <div className="text-left">
                    <p className="font-headline-sm text-headline-sm text-on-surface">{s.title}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Consultation form (reuse existing logic) — hero phía trên thay cho
            header mặc định của form, không lặp lại */}
        <ConsultationForm showHeader={false} />

        {/* CTA về sản phẩm */}
        <section className="w-full py-16 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] text-center">
            <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary">Chưa biết chọn sản phẩm nào?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 max-w-xl mx-auto">
              Tham khảo ngay các sản phẩm thảo dược nổi bật của LocHerbal hoặc đặt lịch để được
              dược sĩ tư vấn liệu trình phù hợp.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-full
                         bg-primary-container text-on-primary font-label-caps text-label-caps uppercase
                         tracking-[0.1em] hover:bg-primary hover:shadow-botanical-hover transition-all duration-300"
            >
              Khám phá sản phẩm <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
