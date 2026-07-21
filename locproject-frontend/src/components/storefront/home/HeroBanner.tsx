import Image from 'next/image';
import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-[#1B4332] to-[#012d1d] pt-12 pb-24 md:pt-20 md:pb-32">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 items-center gap-12 relative z-10">
        <div className="text-center md:text-left">
          <span className="inline-block bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-caption font-bold mb-6 tracking-wide">PHƯƠNG THUỐC CỔ TRUYỀN</span>
          <h2 data-testid="hero-title" className="font-display-lg text-display-lg text-white mb-6 leading-tight">
            Chăm Sóc Sức Khỏe <br /><span className="text-secondary-fixed">Từ Thiên Nhiên</span>
          </h2>
          <p className="font-body-lg text-body-lg text-white/80 mb-10 max-w-lg mx-auto md:mx-0 opacity-80">
            Hơn 200+ sản phẩm thảo dược thuần tự nhiên được nghiên cứu bởi các chuyên gia y học cổ truyền hàng đầu Việt Nam.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link href="/products" className="bg-secondary-fixed hover:bg-secondary-fixed-dim text-on-secondary-fixed font-bold py-4 px-8 rounded-lg shadow-lg active:scale-95 transition-all text-label-bold">
              Khám phá sản phẩm
            </Link>
            <button className="border-2 border-white/30 text-white hover:bg-white/10 font-bold py-4 px-8 rounded-lg transition-all text-label-bold">
              {/* TODO: scroll to ConsultationForm */}
              Tư vấn miễn phí
            </button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 bg-secondary-fixed/10 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <Image
            className="relative w-full h-auto drop-shadow-2xl rounded-2xl transform transition-transform duration-700 group-hover:scale-[1.02]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAx5Rvuv7BRNgN4C1AQFe70cs7jNOt_WvnIWvVdmNRsfqUyDCz3zAADnXqIkKNK5pji0wTbULOUI3Q1Mvx4QpJRhvEk-jbBVk4SuMnvPCtFbxwZWEraKwT68wSLKt45vuBKkXXR4K_KQaY0Py2vptBgoOSfPGQ8_jTVQBvNDOJr4pB5xoSpC0Eld7D3ELMsFwtmrLpiw5AhnJiZppw7goMLIvSmAiGJDFcc51qiNj-rQLN_rYPlJw"
            alt="Sản phẩm thảo dược cao cấp LocHerbal"
            width={600}
            height={500}
            priority
          />
        </div>
      </div>

      {/* Atmospheric Pattern */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 200 C150 100 250 100 300 200 C250 300 150 300 100 200 Z" fill="white"></path>
        </svg>
      </div>
    </section>
  );
}
