'use client';

import { usePublicCompanySettings } from '@/lib/hooks/useSettings';

export default function Footer() {
  const { data: settings } = usePublicCompanySettings();
  const companyName = settings?.companyName || 'LocHerbal';
  const description = settings?.description || 'Giải pháp thảo dược hiện đại cho sức khỏe truyền thống người Việt. Chúng tôi kết hợp tinh hoa y học dân tộc với công nghệ bào chế tiên tiến.';
  const socials = [
    { icon: 'chat_bubble', label: 'Facebook', href: settings?.facebookUrl || '#' },
    { icon: 'play_circle', label: 'YouTube', href: settings?.youtubeUrl || '#' },
    { icon: 'phone_in_talk', label: 'Zalo', href: settings?.zaloUrl || '#' },
  ];

  return (
    <footer className="bg-[#1b4332] text-white mt-0 border-t border-[#012d1d]">
      {/* Main footer content */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">

          {/* Cột 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-accent-gold-light" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              <span className="font-display font-bold text-xl tracking-tight">{companyName}</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              {description}
            </p>
            {/* Social icons dùng Material Symbols */}
            <div className="flex gap-3 pt-1">
              {socials.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-accent-gold hover:text-white flex items-center justify-center transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-lg leading-none">{icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Cột 2: Về chúng tôi */}
          <div>
            <h3 className="font-display font-bold text-base mb-4 tracking-wide text-accent-gold-light uppercase">Về chúng tôi</h3>
            <ul className="space-y-3 text-sm text-white/80">
              {[
                { label: 'Giới thiệu công ty', href: '/ve-chung-toi' },
                { label: 'Hệ thống phân phối', href: '/ve-chung-toi' },
                { label: 'Tuyển dụng', href: '/ve-chung-toi' },
                { label: 'Liên hệ', href: '/lien-he' },
              ].map(item => (
                <li key={item.label}>
                  <a href={item.href} className="hover:text-accent-gold-light hover:underline transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
            {settings?.hotline && (
              <p className="mt-4 text-sm text-white/80 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-gold-light text-base">support_agent</span>
                Hotline: <a href={`tel:${settings.hotline}`} className="hover:text-accent-gold-light font-semibold">{settings.hotline}</a>
              </p>
            )}
          </div>

          {/* Cột 3: Chính sách */}
          <div>
            <h3 className="font-display font-bold text-base mb-4 tracking-wide text-accent-gold-light uppercase">Chính sách</h3>
            <ul className="space-y-3 text-sm text-white/80">
              {['Chính sách bảo mật', 'Chính sách đổi trả', 'Chính sách vận chuyển', 'Điều khoản dịch vụ'].map(item => (
                <li key={item}>
                  <a href="#" className="hover:text-accent-gold-light hover:underline transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: Thanh toán + Newsletter */}
          <div className="space-y-5">
            <div>
              <h3 className="font-display font-bold text-base mb-3 tracking-wide text-accent-gold-light uppercase">Thanh toán</h3>
              <div className="flex flex-wrap gap-2">
                {['VNPAY', 'COD'].map(m => (
                  <span
                    key={m}
                    className="px-3 py-1 bg-white/10 border border-white/5 rounded-lg text-xs font-semibold tracking-wider text-white"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-display font-bold text-base tracking-wide text-accent-gold-light uppercase">Liên hệ</h3>
              <ul className="space-y-2 text-sm text-white/80">
                {settings?.address && (
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-accent-gold-light text-base mt-0.5">location_on</span>
                    {settings.address}
                  </li>
                )}
                {settings?.email && (
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-gold-light text-base">mail</span>
                    <a href={`mailto:${settings.email}`} className="hover:text-accent-gold-light">{settings.email}</a>
                  </li>
                )}
                {settings?.workingHours && (
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-accent-gold-light text-base mt-0.5">schedule</span>
                    <span className="whitespace-pre-line">{settings.workingHours}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-[#012d1d]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/70 text-xs md:text-sm">
            © {new Date().getFullYear()} {companyName}. Bảo lưu mọi quyền.
          </p>
          <p className="text-white/70 text-[11px] md:text-xs tracking-wider uppercase font-semibold">
            {settings?.businessLicense ? `ĐKKD số ${settings.businessLicense}` : 'Được cấp phép bởi Bộ Y Tế Việt Nam'}
          </p>
        </div>
      </div>
    </footer>
  );
}
