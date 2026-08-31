import Link from 'next/link';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';

export const metadata = {
  title: 'Về chúng tôi - LocHerbal Apothecary',
  description:
    'LocHerbal — khơi nguồn sức khỏe từ tinh hoa thảo mộc Việt. Tìm hiểu về con người, tiêu chuẩn chất lượng và cam kết của chúng tôi.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0 bg-transparent">
        {/* Hero */}
        <section className="w-full bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] py-16 md:py-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tertiary/40
                             text-tertiary font-label-caps text-label-caps uppercase tracking-[0.1em] bg-white/40">
              <span className="material-symbols-outlined text-base">eco</span>
              Thảo dược thiên nhiên
            </span>
            <h1 className="text-display-lg md:text-headline-xl text-primary mt-5 leading-[1.1] tracking-[-0.02em] font-display font-bold">
              Về LocHerbal
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-5 max-w-2xl mx-auto">
              Khơi nguồn sức khỏe từ tinh hoa thảo mộc Việt — kết hợp tri thức bản địa
              hàng thế kỷ với tiêu chuẩn apothecary khoa học hiện đại.
            </p>
          </div>
        </section>

        {/* Story / Sứ mệnh */}
        <section className="w-full py-16 md:py-20 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Câu chuyện của chúng tôi</span>
              <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-3">Từ Thảo Nhiên Đến Chuẩn Khoa Học</h2>
              <div className="space-y-5 mt-6">
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  LocHerbal ra đời từ niềm tin rằng thiên nhiên là nguồn dược liệu quý giá nhất.
                  Chúng tôi hợp tác trực tiếp với những vùng trồng dược liệu sạch, lựa chọn
                  nguyên liệu theo chuẩn khắt khe, và bào chế theo quy trình apothecary hiện đại.
                </p>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  Mỗi sản phẩm đều trải qua kiểm nghiệm chất lượng, đảm bảo an toàn và hiệu quả.
                  Chúng tôi cam kết minh bạch về nguồn gốc, thành phần và công dụng — để bạn
                  hoàn toàn yên tâm khi lựa chọn sức khỏe cho chính mình.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 mt-10 max-w-md">
                {[
                  { n: '10+', l: 'Năm kinh nghiệm' },
                  { n: '200+', l: 'Sản phẩm thảo dược' },
                  { n: '50k+', l: 'Khách hàng tin dùng' },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-headline-lg text-headline-lg text-primary">{s.n}</p>
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-primary-container to-[#012d1d]
                              aspect-[4/5] shadow-botanical flex items-center justify-center">
                {/* Botanical line-art trung tính — thay icon-font khổng lồ (Bug 3) */}
                <svg viewBox="0 0 140 180" className="w-52 text-on-primary/25" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M70 168V64" />
                  <path d="M70 88c-18 0-28-10-31-26 16 0 27 9 31 26z" />
                  <path d="M70 88c18 0 28-10 31-26-16 0-27 9-31 26z" />
                  <path d="M70 116c-14 0-23-8-26-21 12 0 21 7 26 21z" />
                  <path d="M70 116c14 0 23-8 26-21-12 0-21 7-26 21z" />
                  <circle cx="70" cy="50" r="4.5" />
                  <path d="M44 148c10 6 42 6 52 0" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Giá trị cốt lõi */}
        <section className="w-full py-16 md:py-20 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="text-center mb-12">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Giá trị cốt lõi</span>
              <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-3">Tại sao chọn LocHerbal</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: 'spa', title: '100% Tự nhiên', desc: 'Nguyên liệu sạch, không chất bảo quản độc hại, canh tác bền vững.' },
                { icon: 'science', title: 'Chuẩn Apothecary', desc: 'Quy trình bào chế và kiểm nghiệm theo tiêu chuẩn hiện đại.' },
                { icon: 'verified', title: 'Minh bạch nguồn gốc', desc: 'Công khai thành phần, nguồn gốc và công dụng từng sản phẩm.' },
                { icon: 'support_agent', title: 'Tư vấn chuyên môn', desc: 'Đội ngũ dược sĩ đồng hành trong suốt quá trình sử dụng.' },
                { icon: 'handshake', title: 'Thương mại công bằng', desc: 'Đảm bảo sinh kế ổn định cho cộng đồng nông dân trồng dược liệu.' },
                { icon: 'shield', title: 'An toàn & uy tín', desc: 'Được cấp phép và tuân thủ quy định về an toàn thực phẩm.' },
              ].map((v) => (
                <div key={v.title} className="bg-surface-container-lowest rounded-lg border border-outline-variant/50
                                             shadow-botanical hover:shadow-botanical-hover transition-shadow p-7 flex flex-col gap-4">
                  <span className="w-12 h-12 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{v.icon}</span>
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{v.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Tiêu chuẩn chất lượng */}
        <section className="w-full py-16 md:py-20 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-secondary-container to-[#745a34]
                              aspect-[4/3] shadow-botanical flex items-center justify-center">
                {/* Apothecary jar line-art trung tính — thay icon-font khổng lồ (Bug 3) */}
                <svg viewBox="0 0 140 110" className="w-44 text-on-primary/35" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="46" y="34" width="48" height="12" rx="4" />
                  <path d="M38 58c0-8 6-12 14-12h36c8 0 14 4 14 12v30c0 10-8 18-18 18H56c-10 0-18-8-18-18V58z" />
                  <path d="M50 62h40" />
                  <path d="M54 76c8 5 24 5 32 0" />
                  <path d="M70 34V22c0-4 3-8 8-8h14" />
                  <circle cx="98" cy="14" r="3" />
                </svg>
              </div>
            </div>
            <div className="lg:col-span-7">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Chất lượng & tiêu chuẩn</span>
              <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-3">Con Người & Tiêu Chuẩn</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-5">
                Đằng sau mỗi sản phẩm là sự tận tụy của những người nông dân gắn bó cả đời với
                đất mẹ. Chúng tôi kết hợp tri thức bản địa với tiêu chuẩn chất lượng quốc tế
                khắt khe nhất.
              </p>
              <div className="space-y-4 mt-8">
                {[
                  { icon: 'eco', title: 'Canh tác bền vững', desc: 'Bảo vệ đa dạng sinh học và nguồn nước tự nhiên.' },
                  { icon: 'handshake', title: 'Thương mại công bằng', desc: 'Đảm bảo sinh kế ổn định cho cộng đồng địa phương.' },
                  { icon: 'verified', title: 'Chứng nhận quốc tế', desc: 'Tuân thủ ISO 22000 và các tiêu chuẩn an toàn thực phẩm.' },
                ].map((s) => (
                  <div key={s.title} className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    </span>
                    <div>
                      <h4 className="font-label-lg text-label-lg text-on-surface">{s.title}</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* CTA */}
        <section className="w-full py-16 md:py-24 bg-primary text-on-primary text-center">
          <div className="mx-auto max-w-[720px] px-margin-mobile md:px-[64px]">
            <h2 className="font-headline-lg text-headline-lg md:text-headline-xl">Bắt đầu hành trình sức khỏe cùng LocHerbal</h2>
            <p className="font-body-lg text-body-lg text-on-primary/80 mt-4">
              Khám phá sản phẩm hoặc đặt lịch tư vấn miễn phí với đội ngũ dược sĩ của chúng tôi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                           bg-on-primary text-primary font-label-caps text-label-caps uppercase
                           tracking-[0.1em] hover:bg-on-primary/90 transition-all duration-300"
              >
                Khám phá sản phẩm <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
              <Link
                href="/tu-van"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                           border border-on-primary/40 text-on-primary font-label-caps text-label-caps uppercase
                           tracking-[0.1em] hover:border-on-primary transition-all duration-300"
              >
                Đặt lịch tư vấn
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

