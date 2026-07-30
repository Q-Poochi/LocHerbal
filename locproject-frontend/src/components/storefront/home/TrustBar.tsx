'use client';

const TRUST_ITEMS = [
  {
    icon: 'verified',
    title: 'Sản phẩm chính hãng 100%',
    desc: 'Cam kết nguồn gốc rõ ràng',
  },
  {
    icon: 'local_shipping',
    title: 'Miễn phí ship đơn 500K+',
    desc: 'Giao hàng toàn quốc',
  },
  {
    icon: 'currency_exchange',
    title: 'Hoàn tiền 30 ngày',
    desc: 'Nếu không hài lòng',
  },
  {
    icon: 'support_agent',
    title: 'Tư vấn chuyên gia 24/7',
    desc: 'Đội ngũ y tế chuyên nghiệp',
  },
];

export default function TrustBar() {
  return (
    <section className="w-full bg-primary-700 py-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {TRUST_ITEMS.map((item, i) => (
            <div
              key={item.title}
              className="flex items-center gap-3 text-white stagger-children"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{item.title}</p>
                <p className="text-white/70 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
