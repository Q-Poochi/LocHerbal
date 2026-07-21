import Image from 'next/image';

export default function PromoBanner() {
  return (
    <section className="py-stack-lg px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-primary-container text-white p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
          <div className="relative z-10 flex-1">
            <span className="text-secondary-fixed font-bold uppercase tracking-widest text-sm mb-4 block">HỢP TÁC PHÁT TRIỂN</span>
            <h2 className="font-headline-lg text-headline-lg mb-6">Chương Trình Đại Lý &amp; CTV LocHerbal</h2>
            <p className="text-body-lg mb-8 opacity-90 max-w-xl">
              Trở thành đối tác tin cậy của chúng tôi để cùng lan tỏa giá trị thảo dược Việt. Hưởng mức chiết khấu hấp dẫn lên tới <span className="text-secondary-fixed font-bold text-2xl">25%</span> trên mỗi đơn hàng.
            </p>
            <button className="bg-white text-primary font-bold py-4 px-10 rounded-lg hover:bg-secondary-fixed transition-colors text-label-bold">
              {/* TODO: connect API /marketing/partner-registration */}
              Đăng ký ngay
            </button>
          </div>

          <div className="relative z-10 w-full md:w-1/3">
            <Image
              className="rounded-xl shadow-2xl border-4 border-white/10"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuACg4-WlN0KSUhfy1sGkTpxLfEpymwhlnFSxrrtCZ2-5IRL9oT_0KnwvPBGIvi6XNqQ3TQJca-mBLRiq19kv7nDv6mvHOrkq6wZ_AW-PL_GLLqaIDEhYEgjbip-kAlxKPh6ic9jCOI64HJbWpmmzBuyRrTyOeu4FiIWqpxTv8kt-W9tOiYNtpEdISCJCcLkasAz7NguK-oLBRvLPP6sz7n5rLM35W5Bu4Fu0bdeW0NHz_5Uithm-Q"
              alt="Chương trình đại lý LocHerbal"
              width={400}
              height={300}
            />
          </div>

          {/* Background Graphics */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" fill="currentColor">
              <pattern height="40" id="pattern-circles" patternUnits="userSpaceOnUse" width="40" x="0" y="0">
                <circle cx="20" cy="20" r="1.5"></circle>
              </pattern>
              <rect fill="url(#pattern-circles)" height="100%" width="100%"></rect>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
