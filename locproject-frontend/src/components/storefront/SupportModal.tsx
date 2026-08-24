'use client';

import { useState, FormEvent, useRef } from 'react';

interface SupportFormData {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  orderId: string;
}

export default function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState<SupportFormData>({
    fullName: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
    orderId: '',
  });
  const [errors, setErrors] = useState<Partial<SupportFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const validateForm = () => {
    const newErrors: Partial<SupportFormData> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
    if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.subject.trim()) newErrors.subject = 'Chủ đề là bắt buộc';
    if (!formData.message.trim()) newErrors.message = 'Nội dung là bắt buộc';
    if (formData.message.trim().length < 10) newErrors.message = 'Nội dung tối thiểu 10 ký tự';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gửi yêu cầu thất bại');
      }

      setSubmitStatus('success');
      setSubmitMessage('Yêu cầu đã được gửi, chúng tôi sẽ liên hệ qua SĐT/email trong thời gian sớm nhất.');
      setFormData({ fullName: '', phone: '', email: '', subject: '', message: '', orderId: '' });
      setTimeout(() => onClose(), 3000);
    } catch (err: any) {
      setSubmitStatus('error');
      setSubmitMessage(err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 id="support-modal-title" className="font-display font-semibold text-xl text-text-primary">
                Gửi yêu cầu hỗ trợ
            </h2>
            <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Đóng"
            >
                <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
        </div>

        {submitStatus === 'success' ? (
            <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <span className="material-symbols-outlined text-[32px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="font-display font-semibold text-xl text-text-primary mb-2">Đã gửi thành công!</h3>
                <p className="text-text-secondary text-sm">Yêu cầu đã được gửi, chúng tôi sẽ liên hệ qua SĐT/email trong thời gian sớm nhất.</p>
            </div>
        ) : submitStatus === 'error' ? (
            <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <span className="material-symbols-outlined text-[32px] text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                </div>
                <h3 className="font-display font-semibold text-xl text-text-primary mb-2">Gửi thất bại</h3>
                <p className="text-text-secondary text-sm">{submitMessage}</p>
                <button
                    onClick={() => setSubmitStatus('idle')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-primary-700 text-primary-700 font-semibold hover:bg-primary-50"
                >
                    Thử lại
                </button>
            </div>
        ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-1">
                        Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-border focus:ring-primary-200'} focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors`}
                        placeholder="Nguyễn Văn A"
                        disabled={isSubmitting}
                        aria-invalid={errors.fullName ? 'true' : 'false'}
                        aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    />
                    {errors.fullName && <p id="fullName-error" className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1">
                        Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-border focus:ring-primary-200'} focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors`}
                        placeholder="0901234567"
                        disabled={isSubmitting}
                        aria-invalid={errors.phone ? 'true' : 'false'}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                    />
                    {errors.phone && <p id="phone-error" className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-border focus:ring-primary-200'} focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors`}
                        placeholder="email@domain.com"
                        disabled={isSubmitting}
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && <p id="email-error" className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-1">
                        Chủ đề <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.subject ? 'border-red-500 focus:ring-red-200' : 'border-border focus:ring-primary-200'} focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors`}
                        placeholder="Khiếu nại về đơn hàng / Tư vấn sản phẩm / Khác"
                        disabled={isSubmitting}
                        aria-invalid={errors.subject ? 'true' : 'false'}
                        aria-describedby={errors.subject ? 'subject-error' : undefined}
                    />
                    {errors.subject && <p id="subject-error" className="mt-1 text-sm text-red-500">{errors.subject}</p>}
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-1">
                        Nội dung <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.message ? 'border-red-500 focus:ring-red-200' : 'border-border focus:ring-primary-200'} focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors resize-none`}
                        placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                        disabled={isSubmitting}
                        aria-invalid={errors.message ? 'true' : 'false'}
                        aria-describedby={errors.message ? 'message-error' : undefined}
                    />
                    {errors.message && <p id="message-error" className="mt-1 text-sm text-red-500">{errors.message}</p>}
                </div>

                <div>
                    <label htmlFor="orderId" className="block text-sm font-medium text-text-primary mb-1">
                        Mã đơn hàng (nếu có)
                    </label>
                    <input
                        type="text"
                        id="orderId"
                        value={formData.orderId}
                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary-200 focus:ring-offset-0 focus:outline-none transition-colors"
                        placeholder="ORD-123456 (tùy chọn)"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-primary-700 text-white font-semibold text-base hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                            Đang gửi...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            Gửi yêu cầu
                        </>
                    )}
                </button>

                <p className="text-xs text-text-tertiary text-center">
                    Bằng cách gửi, bạn đồng ý chúng tôi xử lý thông tin cá nhân theo Chính sách bảo mật.
                </p>
            </form>
        )}

        <div className="px-6 pb-4 text-center">
            <button
                onClick={onClose}
                className="text-text-secondary hover:text-primary-700 text-sm font-medium"
            >
                Đóng
            </button>
        </div>
        </div>
    </div>
  );
}