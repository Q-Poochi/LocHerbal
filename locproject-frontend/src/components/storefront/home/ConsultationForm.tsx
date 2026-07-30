'use client';

import { useState } from 'react';

const HEALTH_TOPICS = [
  'Tim mạch / Huyết áp',
  'Xương khớp / Đau lưng',
  'Tiêu hóa / Dạ dày',
  'Mất ngủ / Căng thẳng',
  'Suy nhược / Mệt mỏi',
  'Khác',
];

type FormState = 'idle' | 'loading' | 'success';

export default function ConsultationForm() {
  const [form, setForm] = useState({ name: '', phone: '', topic: '' });
  const [state, setState] = useState<FormState>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setState('loading');
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setState('success');
  };

  return (
    <section className="w-full py-16 md:py-20 bg-primary-50">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                support_agent
              </span>
              Hoàn toàn miễn phí
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary tracking-tight mb-4">
              Đặt Lịch Tư Vấn Sức Khỏe
            </h2>
            <p className="text-text-secondary text-base leading-relaxed">
              Chuyên gia của chúng tôi sẽ liên hệ với bạn trong vòng <strong>15 phút</strong> để tư vấn giải pháp phù hợp nhất.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-lg border border-border p-8">
            {state === 'success' ? (
              /* Success state */
              <div className="text-center py-8 animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <span
                    className="material-symbols-outlined text-primary-700"
                    style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary mb-2">
                  Đã nhận đăng ký!
                </h3>
                <p className="text-text-secondary">
                  Chuyên gia sẽ gọi điện cho bạn trong <strong>15 phút</strong>.
                  <br />
                  Cảm ơn bạn đã tin tưởng LocHerbal!
                </p>
                <button
                  type="button"
                  onClick={() => { setState('idle'); setForm({ name: '', phone: '', topic: '' }); }}
                  className="mt-6 px-6 py-2.5 rounded-full border border-primary-700 text-primary-700
                             text-sm font-medium hover:bg-primary-50 transition-colors"
                >
                  Đăng ký thêm
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Họ và tên <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface-alt
                               focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                               transition-all duration-150 text-text-primary placeholder:text-text-tertiary"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Số điện thoại <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0901 234 567"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface-alt
                               focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                               transition-all duration-150 text-text-primary placeholder:text-text-tertiary"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Vấn đề sức khỏe cần tư vấn
                  </label>
                  <select
                    value={form.topic}
                    onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    className="w-full px-4 py-3.5 md:py-3 rounded-xl border border-border bg-surface-alt
                               focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                               transition-all duration-150 text-text-primary appearance-none cursor-pointer"
                  >
                    <option value="">Chọn vấn đề sức khỏe...</option>
                    {HEALTH_TOPICS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={state === 'loading'}
                  className="w-full py-4 rounded-xl bg-primary-700 text-white font-semibold text-base
                             hover:bg-primary-800 hover:shadow-lg transition-all duration-200
                             disabled:opacity-70 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {state === 'loading' ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">send</span>
                      Đặt lịch tư vấn miễn phí
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-text-tertiary">
                  🔒 Thông tin của bạn được bảo mật hoàn toàn
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
