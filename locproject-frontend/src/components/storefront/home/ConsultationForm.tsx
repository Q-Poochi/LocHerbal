'use client';

import { useMemo, useState } from 'react';
import { useConsultationSlots, useBookConsultation } from '@/lib/hooks/useConsultation';

type FormState = 'idle' | 'loading' | 'success';

interface DayMeta {
    date: string;
    label: string;
    dow: string;
    dom: string;
    disabled: boolean;
}

function buildDayOptions(): DayMeta[] {
    const today = new Date();
    const days: DayMeta[] = [];
    const DOW_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 0; i < 14; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        days.push({
            date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
            dow: DOW_VI[d.getDay()],
            dom: String(d.getDate()),
            disabled: d.getDay() === 0, // Chủ nhật nghỉ
        });
    }
    return days;
}

export default function ConsultationForm({ showHeader = true }: { showHeader?: boolean }) {
    const days = useMemo(() => buildDayOptions(), []);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [form, setForm] = useState({ name: '', phone: '', email: '', topic: '' });
    const [selectedTime, setSelectedTime] = useState('');
    const [state, setState] = useState<FormState>('idle');
    const [error, setError] = useState('');

    const { data: slotsData, isLoading: slotsLoading } = useConsultationSlots(selectedDate || undefined);
    const bookMutation = useBookConsultation();

    const slots = slotsData?.preferredHours ?? [];
    const selectedDayDisabled = days.find(d => d.date === selectedDate)?.disabled ?? false;
    const slotsForDate = selectedDate && !selectedDayDisabled ? slots : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.phone || !selectedDate || !selectedTime) return;
        setError('');
        setState('loading');
        try {
            await bookMutation.mutateAsync({
                fullName: form.name,
                phone: form.phone,
                email: form.email || undefined,
                note: form.topic ? `Chủ đề: ${form.topic}` : undefined,
                preferredDate: selectedDate,
                preferredTime: selectedTime,
            });
            setState('success');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(typeof message === 'string' ? message : 'Đặt lịch thất bại, vui lòng thử lại.');
            setState('idle');
        }
    };

    const resetForm = () => {
        setState('idle');
        setForm({ name: '', phone: '', email: '', topic: '' });
        setSelectedTime('');
        setError('');
    };

    return (
    <section id="consultation" className="w-full py-16 md:py-20 bg-transparent">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="max-w-2xl mx-auto">
          {/* Header — chỉ render ở nơi KHÔNG có hero riêng (home). Trang /tu-van
              đã có hero giống hệt nội dung này nên truyền showHeader={false}
              để tránh lặp nội dung "y hệt 2 lần" (bug 5) */}
          {showHeader && (
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
          )}

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
                  Đã nhận lịch tư vấn!
                </h3>
                <p className="text-text-secondary">
                  Chuyên gia sẽ gọi điện cho bạn vào <strong>{selectedTime}</strong> ngày <strong>{selectedDate}</strong>.
                  <br />
                  Cảm ơn bạn đã tin tưởng LocHerbal!
                </p>
                <button
                  type="button"
                  onClick={resetForm}
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

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Email <span className="text-text-tertiary">(không bắt buộc)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
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
                  <textarea
                    value={form.topic}
                    onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    placeholder="Mô tả ngắn vấn đề của bạn..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface-alt
                               focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                               transition-all duration-150 text-text-primary placeholder:text-text-tertiary"
                  />
                </div>

                {/* Date picker */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Chọn ngày tư vấn <span className="text-error">*</span>
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {days.map((d) => {
                        const active = selectedDate === d.date;
                        return (
                            <button
                                key={d.date}
                                type="button"
                                disabled={d.disabled}
                                onClick={() => { setSelectedDate(d.date); setSelectedTime(''); }}
                                className={`flex flex-col items-center rounded-xl border px-3 py-2 min-w-[64px] shrink-0 transition-all
                                    ${d.disabled
                                        ? 'bg-surface-alt border-border opacity-40 cursor-not-allowed'
                                        : active
                                            ? 'bg-primary-700 border-primary-700 text-white shadow-md'
                                            : 'bg-white border-border hover:border-primary-400 hover:bg-primary-50'}`}
                            >
                                <span className={`text-[11px] font-medium ${active ? 'text-primary-100' : 'text-text-tertiary'}`}>
                                    {d.dow}
                                </span>
                                <span className="text-sm font-bold">{d.label}</span>
                            </button>
                        );
                    })}
                  </div>
                  <p className="text-xs text-text-tertiary mt-1.5">
                    Chủ nhật nghỉ — giờ tư vấn: T2-T6 08:00-17:00, T7 08:00-12:00
                  </p>
                </div>

                {/* Slot picker */}
                {selectedDate && (
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                            Khung giờ tư vấn <span className="text-error">*</span>
                        </label>
                        {slotsLoading ? (
                            <p className="text-sm text-text-tertiary">Đang tải giờ trống...</p>
                        ) : slotsForDate === null ? (
                            <p className="text-sm text-error">Ngày này không nhận tư vấn.</p>
                        ) : slotsForDate.length === 0 ? (
                            <p className="text-sm text-text-tertiary">Ngày này đã hết giờ trống.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {slotsForDate.map((s) => {
                                    const active = selectedTime === s.label;
                                    return (
                                        <button
                                            key={s.label}
                                            type="button"
                                            onClick={() => setSelectedTime(s.label)}
                                            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all
                                                ${active
                                                    ? 'bg-primary-700 border-primary-700 text-white shadow-md'
                                                    : 'bg-white border-border hover:border-primary-400 hover:bg-primary-50'}`}
                                        >
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="px-4 py-3 rounded-xl bg-error-container text-error text-sm">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={state === 'loading' || !selectedDate || !selectedTime}
                  className="w-full py-4 rounded-xl bg-primary-700 text-white font-semibold text-base
                             hover:bg-primary-800 hover:shadow-lg transition-all duration-200
                             disabled:opacity-60 disabled:cursor-not-allowed
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