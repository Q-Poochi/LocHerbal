'use client';

import { useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success';

export default function ConsultationForm() {
  const [formState, setFormState] = useState<FormState>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('submitting');
    // TODO: connect API /marketing/consultation-requests
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setFormState('success');
    setTimeout(() => setFormState('idle'), 3000);
  };

  return (
    <section className="w-full py-stack-lg">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 p-10 md:p-16 bg-primary-container text-white">
            <h3 className="font-headline-lg text-headline-lg mb-6">Nhận Tư Vấn Miễn Phí <br />Từ Chuyên Gia</h3>
            <p className="text-body-lg opacity-80 mb-10">
              Đội ngũ bác sĩ và chuyên gia y học cổ truyền của chúng tôi luôn sẵn sàng lắng nghe và tư vấn giải pháp sức khỏe phù hợp nhất cho bạn.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary-fixed">check_circle</span>
                <div>
                  <h5 className="font-bold">Bảo mật thông tin</h5>
                  <p className="text-caption opacity-70">Cam kết không chia sẻ dữ liệu cho bên thứ ba.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary-fixed">history</span>
                <div>
                  <h5 className="font-bold">Phản hồi nhanh chóng</h5>
                  <p className="text-caption opacity-70">Chúng tôi sẽ gọi lại cho bạn trong vòng 30 phút.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-1/2 p-10 md:p-16">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface mb-2" htmlFor="consultation-name">Họ và tên *</label>
                <input
                  id="consultation-name"
                  className="w-full border-outline-variant rounded-lg p-3 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Nhập họ và tên của bạn"
                  type="text"
                  required
                />
              </div>
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface mb-2" htmlFor="consultation-phone">Số điện thoại *</label>
                <input
                  id="consultation-phone"
                  className="w-full border-outline-variant rounded-lg p-3 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Nhập số điện thoại"
                  type="tel"
                  required
                />
              </div>
              <div>
                <label className="block font-label-bold text-label-bold text-on-surface mb-2" htmlFor="consultation-specialty">Vấn đề sức khỏe cần tư vấn</label>
                <select id="consultation-specialty" className="w-full border-outline-variant rounded-lg p-3 focus:ring-primary focus:border-primary transition-all">
                  <option>Chọn chuyên khoa</option>
                  <option>Hệ thần kinh</option>
                  <option>Hệ tiêu hóa</option>
                  <option>Xương khớp</option>
                  <option>Khác...</option>
                </select>
              </div>
              <button
                className={`w-full font-bold py-4 rounded-lg shadow-lg active:scale-95 transition-all text-label-bold ${
                  formState === 'success'
                    ? 'bg-success-leaf text-white'
                    : 'bg-secondary hover:bg-secondary-container text-white hover:text-on-secondary-container'
                }`}
                type="submit"
                disabled={formState === 'submitting'}
              >
                {formState === 'submitting' ? 'Đang gửi...' : formState === 'success' ? 'Gửi thành công!' : 'Gửi thông tin tư vấn'}
              </button>
              <p className="text-[10px] text-center text-on-surface-variant">Bằng cách nhấn gửi, bạn đồng ý với Chính sách bảo mật của LocHerbal.</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
