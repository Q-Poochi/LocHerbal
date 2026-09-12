'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import { usePublicPageBlocks } from '@/lib/hooks/useMarketing';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import {
  AnimatedCounter,
  CurtainMediaReveal,
  HeroTextReveal,
  MaskedTextReveal,
  MarqueeTicker,
  Reveal,
  ScrollExpandMedia,
  StaggerReveal,
  TiltCard,
} from '@/components/storefront/motion/Reveal';

export default function AboutPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Lấy dữ liệu tùy biến động từ Admin nếu có cấu hình
  const { data: adminBlocks = [] } = usePublicPageBlocks('about-us');

  // Trích xuất các block theo type từ Admin (nếu admin đã tạo)
  const heroBlock = adminBlocks.find((b) => b.type === 'hero');
  const teamBlock = adminBlocks.find((b) => b.type === 'team');
  const timelineBlock = adminBlocks.find((b) => b.type === 'timeline');
  const statsBlock = adminBlocks.find((b) => b.type === 'stats');

  const certifications = [
    { label: 'GMP Tiêu Chuẩn Quốc Tế', icon: 'verified' },
    { label: 'ISO 22000:2018', icon: 'health_and_safety' },
    { label: '100% Thuần Thảo Dược', icon: 'eco' },
    { label: 'Canh Tác Không Hóa Chất', icon: 'spa' },
    { label: 'OCOP 4 Sao Quốc Gia', icon: 'stars' },
    { label: 'Non-GMO Không Biến Đổi Gen', icon: 'nature' },
  ];

  // Dữ liệu mặc định tinh tuyển cho 4 trạm hành trình
  const defaultJourney = [
    {
      step: '01',
      title: 'Vùng Dược Liệu Bản Địa Tây Bắc',
      sub: 'Thổ Nhưỡng Nguyên Sơ & Khí Hậu Tinh Khiết',
      desc: 'Chúng tôi liên kết canh tác hữu cơ trên những dải núi cao Hoàng Liên Sơn, nơi thổ nhưỡng giàu khoáng và sương mù bao phủ quanh năm giúp dược liệu tích lũy hàm lượng saponin và tinh dầu cao nhất.',
      tag: 'Canh tác sinh thái',
      img: '/images/decor/home-bg.webp',
    },
    {
      step: '02',
      title: 'Thu Hái Lúc Bình Minh & Sấy Lạnh',
      sub: 'Công Nghệ Ly Tâm Sấy Lạnh Phân Đoạn',
      desc: 'Dược thảo chỉ được thu hái thủ công từ 5h00 đến 8h00 sáng khi những giọt sương chưa tan để giữ trọn vẹn sức sống tự nhiên, sau đó đưa vào buồng sấy lạnh phân đoạn giữ lại hơn 98% hoạt tính sinh học quý.',
      tag: 'Bảo toàn dược tính',
      img: '/images/decor/tu-van.webp',
    },
    {
      step: '03',
      title: 'Chuẩn Hóa Apothecary Hiện Đại',
      sub: 'Quy Trình Kiểm Nghiệm Đa Tầng Tại Phòng Lab',
      desc: 'Mỗi mẻ chiết xuất đều trải qua hệ thống phân tích sắc ký lỏng hiệu năng cao (HPLC), kiểm định vi sinh vật và kim loại nặng nghiêm ngặt trước khi định hình thành phẩm đạt chuẩn bộ Y Tế.',
      tag: 'Kiểm nghiệm khắt khe',
      img: '/images/decor/space.webp',
    },
    {
      step: '04',
      title: 'Đóng Gói Sinh Thái & Vẹn Toàn',
      sub: 'Bảo Vệ Môi Trường & Người Sử Dụng',
      desc: 'Sản phẩm được đóng trong hũ thủy tinh y tế tối màu chống quang hóa hoặc bao bì giấy kraft tự phân hủy sinh học, trao gửi đến tay bạn bằng sự trân trọng và tận tâm tuyệt đối.',
      tag: 'Bền vững & Thân thiện',
      img: '/images/decor/uu-dai.webp',
    },
  ];

  // Nếu Admin cấu hình timeline block thì map động, ngược lại dùng default
  const milestones = timelineBlock?.content?.milestones as any[] | undefined;
  const journeySteps = milestones && Array.isArray(milestones) && milestones.length > 0
    ? milestones.map((m, idx) => ({
        step: `0${idx + 1}`,
        title: m.title || `Trạm 0${idx + 1}`,
        sub: m.year ? `Giai đoạn ${m.year}` : 'Quy trình chuẩn hóa',
        desc: m.description || '',
        tag: 'Tiêu chuẩn LocHerbal',
        img: defaultJourney[idx % defaultJourney.length].img,
      }))
    : defaultJourney;

  // Dữ liệu đội ngũ chuyên gia (hỗ trợ đọc từ Team Block trong Admin)
  const defaultExperts = [
    {
      name: 'DS. Nguyễn Minh Trí',
      role: 'Chuyên gia nghiên cứu Dược học Cổ truyền',
      exp: '15+ năm nghiên cứu dược liệu bản địa',
      quote: 'Dược tính của đất mẹ Việt Nam vô cùng kỳ diệu, chỉ cần chúng ta biết lắng nghe và chuẩn hóa bằng khoa học hiện đại.',
      img: '/images/decor/tu-van.webp',
    },
    {
      name: 'BS. Lê Thu Hằng',
      role: 'Cố vấn Y học Dưỡng sinh Chủ động',
      exp: 'Chuyên khoa Dưỡng sinh & Dược trị liệu',
      quote: 'Chăm sóc sức khỏe không phải chờ đến khi có bệnh, mà là nuôi dưỡng từng tế bào mỗi ngày bằng tinh hoa thiên nhiên.',
      img: '/images/decor/authentication.webp',
    },
  ];

  const members = teamBlock?.content?.members as any[] | undefined;
  const experts = members && Array.isArray(members) && members.length > 0
    ? members.map((m, idx) => ({
        name: m.name,
        role: m.role || 'Chuyên gia LocHerbal',
        exp: 'Chuyên môn Dược học',
        quote: m.bio || 'Tận tâm vì sức khỏe cộng đồng.',
        img: resolveImageUrl(m.avatarUrl) || defaultExperts[idx % defaultExperts.length].img,
      }))
    : defaultExperts;

  // Ảnh showcase lấy từ Hero Block admin nếu có upload, ngược lại dùng space.webp
  const showcaseImage = heroBlock?.content?.backgroundImageUrl
    ? (resolveImageUrl(heroBlock.content.backgroundImageUrl as string) || '/images/decor/space.webp')
    : '/images/decor/space.webp';

  const showcaseTitle = (heroBlock?.content?.title as string) || 'Nơi Thảo Dược Giao Thoa Cùng Khoa Học';
  const showcaseSubtitle = (heroBlock?.content?.subtitle as string) || 'Mỗi dược liệu được theo dõi từ khi ươm mầm, tưới mát bởi nguồn nước khoáng tự nhiên cho đến khi đạt độ chín dược chất hoàn hảo nhất.';

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0 bg-transparent">
        {/* ━━━ 1. HERO SECTION ━━━ */}
        <section className="w-full bg-transparent pt-14 md:pt-20 pb-10">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tertiary/40
                             text-tertiary font-label-caps text-label-caps uppercase tracking-[0.14em] bg-white/50 backdrop-blur-sm">
              <span className="material-symbols-outlined text-base">eco</span>
              LocHerbal Heritage & Science
            </span>
            <h1 className="text-display-lg md:text-headline-xl text-primary mt-6 leading-[1.06] tracking-[-0.035em] font-display font-bold">
              <HeroTextReveal lines={['Khởi Nguồn Sức Khỏe', 'Từ Tinh Hoa Thảo Mộc']} />
            </h1>
            <div className="mt-6 max-w-2xl mx-auto">
              <MaskedTextReveal
                className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed"
                lines={[
                  'LocHerbal kết nối tri thức y học cổ truyền ngàn năm của người Việt',
                  'với quy chuẩn kiểm nghiệm phòng thí nghiệm (Apothecary) tiên tiến.',
                ]}
              />
            </div>
          </div>
        </section>

        {/* ━━━ 2. CINEMATIC VIDEO & AMBIENT SHOWCASE (Scroll Expand - Dynamic From Admin) ━━━ */}
        <section className="w-full py-8 md:py-12 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <ScrollExpandMedia className="rounded-3xl overflow-hidden border border-white/40 shadow-2xl relative">
              <CurtainMediaReveal aspect="aspect-[16/10] md:aspect-[21/9]">
                <div className="relative w-full h-full bg-surface-container-high group">
                  <Image
                    src={showcaseImage}
                    alt="Không gian bào chế LocHerbal Apothecary"
                    fill
                    priority
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className={`object-cover object-center transition-transform duration-1000 ${isPlaying ? 'scale-105' : 'scale-100'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

                  {/* Player Top Controls / Badges */}
                  <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-emerald-300 font-label-caps text-xs tracking-widest uppercase border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Showcase • Brand Film
                    </span>
                    <div className="pointer-events-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        aria-label="Toggle mute"
                        className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center transition-colors border border-white/15"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {isMuted ? 'volume_off' : 'volume_up'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        aria-label="Toggle play"
                        className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center transition-colors border border-white/15"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Overlay Narrative Text */}
                  <div className="absolute bottom-8 left-6 right-6 md:bottom-12 md:left-12 md:right-12 text-white">
                    <span className="font-label-caps text-xs md:text-sm uppercase tracking-[0.2em] text-emerald-300 font-semibold">
                      LocHerbal Laboratories & Gardens
                    </span>
                    <div className="mt-2 max-w-3xl">
                      <MaskedTextReveal
                        className="font-headline-lg text-2xl md:text-4xl text-white font-bold leading-tight"
                        lines={[showcaseTitle]}
                      />
                    </div>
                    <p className="font-body-md text-white/80 mt-3 max-w-2xl hidden sm:block leading-relaxed">
                      {showcaseSubtitle}
                    </p>
                  </div>
                </div>
              </CurtainMediaReveal>
            </ScrollExpandMedia>
          </div>
        </section>

        {/* ━━━ 3. MARQUEE CERTIFICATIONS TICKER ━━━ */}
        <section className="w-full bg-emerald-950/5 backdrop-blur-sm my-8">
          <MarqueeTicker items={certifications} />
        </section>

        {/* ━━━ 4. STICKY STORYTELLING: HÀNH TRÌNH 4 TRẠM ━━━ */}
        <section className="w-full py-16 md:py-24 bg-transparent relative">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-4 lg:sticky lg:top-28">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.14em]">
                  Chu trình khép kín
                </span>
                <div className="mt-3">
                  <MaskedTextReveal
                    className="font-headline-lg text-headline-lg md:text-3xl text-primary font-bold leading-tight"
                    lines={['Hành Trình', 'Từ Vườn Thuốc', 'Đến Tay Bạn']}
                  />
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mt-5 leading-relaxed">
                  Để đảm bảo chất lượng tinh túy nhất, LocHerbal vận hành quy trình các trạm tiêu chuẩn nghiêm ngặt, minh bạch từng công đoạn.
                </p>

                <div className="mt-8 space-y-4 hidden lg:block border-l-2 border-outline-variant/50 pl-5">
                  {journeySteps.map((j) => (
                    <div key={j.step} className="group cursor-pointer">
                      <span className="font-label-caps text-xs text-secondary font-bold">Trạm {j.step}</span>
                      <p className="font-body-sm text-sm text-on-surface font-medium group-hover:text-primary transition-colors">
                        {j.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-16 md:space-y-24">
                {journeySteps.map((step) => (
                  <div key={step.step} className="relative">
                    <CurtainMediaReveal aspect="aspect-[16/10] md:aspect-[16/9]" className="rounded-3xl shadow-xl overflow-hidden">
                      <div className="relative w-full h-full bg-surface-container-high">
                        <Image
                          src={step.img}
                          alt={step.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 750px"
                          className="object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                        <span className="absolute top-6 left-6 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-primary font-label-caps text-xs font-bold uppercase tracking-wider">
                          Trạm {step.step} • {step.tag}
                        </span>
                      </div>
                    </CurtainMediaReveal>

                    <div className="mt-6 p-6 md:p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-outline-variant/30 shadow-botanical">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-3xl font-display font-bold text-primary/30">{step.step}</span>
                        <span className="font-label-caps text-xs text-tertiary uppercase tracking-wider">{step.sub}</span>
                      </div>
                      <h3 className="font-headline-md text-xl md:text-2xl text-primary font-bold mt-2">
                        {step.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-3 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ 5. SỐ LIỆU MINH BẠCH & THỐNG KÊ ━━━ */}
        <section className="w-full py-16 md:py-20 bg-primary-container/10 border-y border-outline-variant/30">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="text-center mb-12">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.14em]">Thành tựu thực tế</span>
              <div className="mt-2">
                <MaskedTextReveal
                  className="font-headline-lg text-headline-lg md:text-headline-xl text-primary font-bold"
                  lines={['Những Con Số Đầy Tự Hào']}
                />
              </div>
            </div>
            <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { n: 120, suffix: '+', l: 'Hecta vùng trồng sạch', sub: 'Tại Sa Pa & Mộc Châu' },
                { n: 15, suffix: '+', l: 'Năm kinh nghiệm dược học', sub: 'Đội ngũ chuyên môn sâu' },
                { n: 50, suffix: 'k+', l: 'Khách hàng đồng hành', sub: 'Tỷ lệ hài lòng 98.6%' },
                { n: 100, suffix: '%', l: 'Minh bạch nguồn gốc', sub: 'Truy xuất mã QR từng lô' },
              ].map((s) => (
                <div key={s.l} className="p-8 rounded-2xl bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant/40 shadow-botanical text-center flex flex-col justify-between">
                  <p className="font-headline-lg text-3xl md:text-4xl text-primary font-bold">
                    <AnimatedCounter value={s.n} suffix={s.suffix} />
                  </p>
                  <div>
                    <h4 className="font-label-lg text-on-surface font-semibold mt-3">{s.l}</h4>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-1">{s.sub}</p>
                  </div>
                </div>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* ━━━ 6. ĐỘI NGŨ CHUYÊN GIA (TILT 3D CARDS - Dynamic From Admin) ━━━ */}
        <section className="w-full py-16 md:py-24 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="text-center mb-14">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.14em]">Những người đồng hành</span>
              <div className="mt-3">
                <MaskedTextReveal
                  className="font-headline-lg text-headline-lg md:text-headline-xl text-primary font-bold"
                  lines={['Đội Ngũ Chuyên Gia Dược Sĩ']}
                />
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-3 max-w-xl mx-auto">
                Tâm huyết mang tinh hoa ngàn năm của thảo dược Việt bảo vệ sức khỏe triệu gia đình.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {experts.map((exp) => (
                <TiltCard key={exp.name} className="h-full">
                  <div className="h-full p-8 rounded-3xl bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/40 shadow-botanical flex flex-col justify-between">
                    <div>
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md mb-6">
                        <Image
                          src={exp.img}
                          alt={exp.name}
                          fill
                          className="object-cover object-center"
                        />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-xs uppercase tracking-wider font-semibold">
                        {exp.exp}
                      </span>
                      <h3 className="font-headline-md text-xl text-on-surface font-bold mt-3">{exp.name}</h3>
                      <p className="font-body-sm text-sm text-secondary font-medium">{exp.role}</p>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-4 italic leading-relaxed">
                        &ldquo;{exp.quote}&rdquo;
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-xs text-primary font-medium">
                      <span className="material-symbols-outlined text-base">verified_user</span>
                      Chứng chỉ hành nghề Dược Lâm Sàng
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ 7. CTA SECTION ━━━ */}
        <section className="w-full py-20 md:py-28 bg-primary text-on-primary text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="mx-auto max-w-[760px] px-margin-mobile md:px-[64px] relative z-10">
            <MaskedTextReveal
              className="font-headline-lg text-headline-lg md:text-headline-xl text-white font-bold"
              lines={['Trải Nghiệm Thảo Mộc Đích Thực', 'Cùng Dược Sĩ LocHerbal']}
            />
            <Reveal className="mt-5">
              <p className="font-body-lg text-body-lg text-on-primary/85 leading-relaxed">
                Chúng tôi luôn sẵn sàng lắng nghe thể trạng của bạn để tư vấn liệu trình thảo dược tự nhiên và phù hợp nhất.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                             bg-on-primary text-primary font-label-caps text-label-caps uppercase
                             tracking-[0.1em] hover:bg-on-primary/90 hover:scale-105 transition-all duration-300 shadow-xl font-semibold"
                >
                  Khám phá danh mục <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link
                  href="/tu-van"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                             border border-on-primary/40 text-on-primary font-label-caps text-label-caps uppercase
                             tracking-[0.1em] hover:border-on-primary hover:bg-white/10 transition-all duration-300 font-semibold"
                >
                  Đặt lịch tư vấn miễn phí
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
