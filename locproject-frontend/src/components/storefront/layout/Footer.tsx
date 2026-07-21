import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container w-full py-stack-lg mt-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            <h2 className="font-headline-md text-headline-md text-on-primary">LocHerbal</h2>
          </div>
          <p className="font-body-sm text-body-sm opacity-80 leading-relaxed">
            Giải pháp thảo dược hiện đại cho sức khỏe truyền thống. Chúng tôi kết hợp tinh hoa y học dân tộc với công nghệ bào chế tiên tiến.
          </p>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" href="#">
              <Image alt="Facebook" className="w-5 h-5 invert" width={20} height={20} src="https://lh3.googleusercontent.com/aida-public/AB6AXuABUStJxMAEtFuQCyvBD8vZbgkCFl6ZgBwRRAkYElGFJ0eowdze9vDd7AgldI0QO9p40MvPZJ5EjHbb7BXMLJsR8IfQDjVnWYHWyLHDmCuq048s9_mxEZVPl1MgmkH8gCYREueUnBuZRbK0NvDgBs2HsNV1gMMk2wP44PL64lQ_JiJthQCpfNlWZnTATcUhxQdqM1RlFlPoHxh9SvjiDClthNTx-8bc4TL_dZqdU_iuz2qM2d3Cvg" />
            </a>
            <a className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors font-bold" href="#">Z</a>
            <a className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" href="#">
              <Image alt="YouTube" className="w-8 h-8 invert" width={32} height={32} src="https://lh3.googleusercontent.com/aida-public/AB6AXuAr71xHlOYO7MKQNcukGsgDtDZbjmV8gMbVygpnO-_FB5Z828cnsbK58RvEcoV5V1029CGtGvhsWrnqhhJPPa47xCOzVLer7C7b4J7ZbJAHF7K6ndN_MLd2emKZEecyQrzvh5y-3dMkhzpLivbtNnPfGNgtucOxTFliFTfSxB8iZyXGRKwxetqshPpriNEga2qTMntp-MCSsu3I7ghkHix81zQUo3qZkTSy6rgLSzpLbdIKdyqsrA" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-label-bold text-label-bold mb-6 text-white">Về chúng tôi</h4>
          <ul className="space-y-4">
            <li><a className="font-body-sm text-body-sm opacity-80 hover:text-secondary-fixed transition-all" href="#">Giới thiệu công ty</a></li>
            <li><a className="font-body-sm text-body-sm opacity-80 hover:text-secondary-fixed transition-all" href="#">Hệ thống phân phối</a></li>
            <li><a className="font-body-sm text-body-sm opacity-80 hover:text-secondary-fixed transition-all" href="#">Tuyển dụng</a></li>
            <li><a className="font-body-sm text-body-sm opacity-80 hover:text-secondary-fixed transition-all" href="#">Liên hệ</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-label-bold text-label-bold mb-6 text-white">Chính sách</h4>
          <ul className="space-y-4">
            <li><a className="font-body-sm text-body-sm opacity-80 hover:text-secondary-fixed transition-all" href="#">Chính sách bảo mật</a></li>
            <li><a className="font-body-sm text-body-sm opacity-80 hover:text-secondary-fixed transition-all" href="#">Chính sách đổi trả</a></li>
            <li><a className="font-body-sm text-body-sm opacity-80 hover:text-secondary-fixed transition-all" href="#">Chính sách vận chuyển</a></li>
            <li><a className="font-body-sm text-body-sm opacity-80 hover:text-secondary-fixed transition-all" href="#">Điều khoản dịch vụ</a></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="font-label-bold text-label-bold mb-6 text-white">Thanh toán</h4>
          <div className="flex flex-wrap gap-4 grayscale opacity-60">
            <Image alt="MoMo" className="h-8 bg-white p-1 rounded" width={64} height={32} src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl8-dhGoA_gyIV3wHP47BsiX7Ne6xN_klJVzAnEDPWJ_BDB-pYHU33cU6YYkbTHDHcASHjNmbziNuP9vh1Zvt1hQ1MWq6lJ6tyt7wwwJ-jEadu9cZYSStkqNX7HF4tSpsh-xph0Yte8pKdDCg0UNQcOI-sJ4R2ZLI2DCVVHeJ2eNmtDrp1LFQMTRZBMcRlYMAxtOFK9_2Rm5J9uUzVts1KRf649pfGTHo0eTFcqeips1yj4uE97A" />
            <Image alt="VNPay" className="h-8 bg-white p-1 rounded" width={64} height={32} src="https://lh3.googleusercontent.com/aida-public/AB6AXuACtRmdGyRpchfAK7jCXoeH3lvrccjhXM-HAEE1yTHyMxJ_Oo1gXtXqWMFIf-MHYT8k3JZyelsPmEu80Ley74rycWH215VA9AY2ZCEe2Q8dUBzd1R35-7lXK_bwnYlr270tgxM3p66JBerANqDuzw41OF0vX9zjF-nqda4UgiHJ-jr2iTgxJq6x-QKXQ0AtArzndQkb8xTrAFVp7tJh5qkStSW06bLRy0apkGd6R7ibISrFhjkdJg" />
            <div className="bg-white p-1 rounded h-8 flex items-center px-2 text-primary font-bold text-[10px]">COD</div>
          </div>
          <div className="pt-4 border-t border-white/10">
            <h4 className="font-label-bold text-label-bold mb-2 text-white">Đăng ký nhận tin</h4>
            <div className="flex">
              <input className="bg-white/10 border-none rounded-l-lg p-2 text-white placeholder-white/40 flex-1" placeholder="Email của bạn" type="email" />
              <button className="bg-secondary text-white px-4 rounded-r-lg hover:bg-secondary-container transition-colors">
                {/* TODO: connect API /marketing/subscribe */}
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-white/10 text-center px-margin-mobile">
        <p className="font-body-sm text-body-sm opacity-60 text-on-primary">© 2024 LocHerbal. Giải pháp thảo dược hiện đại cho sức khỏe truyền thống.</p>
      </div>
    </footer>
  );
}
