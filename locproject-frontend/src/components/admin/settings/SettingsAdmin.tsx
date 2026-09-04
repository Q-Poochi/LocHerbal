'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import { useCompanySettings, useUpdateCompanySettings } from '@/lib/hooks/useSettings';

const EMPTY = {
    companyName: '',
    tagline: '',
    description: '',
    about: '',
    address: '',
    phone: '',
    hotline: '',
    email: '',
    workingHours: '',
    facebookUrl: '',
    youtubeUrl: '',
    zaloUrl: '',
    websiteUrl: '',
    taxCode: '',
    businessLicense: '',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="admin-card p-6 space-y-5">
            <h3 className="font-headline-sm text-headline-sm text-primary">{title}</h3>
            {children}
        </section>
    );
}

export default function SettingsAdmin() {
    const toast = useToast();
    const { data, isLoading, error } = useCompanySettings();
    const mutation = useUpdateCompanySettings();
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        if (data) {
            setForm({
                companyName: data.companyName ?? '',
                tagline: data.tagline ?? '',
                description: data.description ?? '',
                about: data.about ?? '',
                address: data.address ?? '',
                phone: data.phone ?? '',
                hotline: data.hotline ?? '',
                email: data.email ?? '',
                workingHours: data.workingHours ?? '',
                facebookUrl: data.facebookUrl ?? '',
                youtubeUrl: data.youtubeUrl ?? '',
                zaloUrl: data.zaloUrl ?? '',
                websiteUrl: data.websiteUrl ?? '',
                taxCode: data.taxCode ?? '',
                businessLicense: data.businessLicense ?? '',
            });
        }
    }, [data]);

    const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.companyName.trim()) {
            toast.error('Vui lòng nhập tên công ty');
            return;
        }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast.error('Email không hợp lệ');
            return;
        }
        try {
            await mutation.mutateAsync(form);
            toast.success('Đã lưu cài đặt công ty');
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể lưu cài đặt'));
        }
    };

    const label = 'font-label-bold text-label-bold text-primary';
    const input =
        'w-full bg-surface-container-low border border-border rounded-xl px-4 py-3 text-body-md text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors';

    return (
        <form onSubmit={handleSubmit} className="max-w-[860px]">
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-8">
                <span>Hệ thống</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Cài đặt chung</span>
            </nav>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-8">Cài đặt công ty</h2>
            <p className="text-sm text-text-tertiary -mt-6 mb-8">Thông tin hiển thị ở footer, trang Về chúng tôi và Liên hệ của storefront.</p>

            {isLoading ? (
                <div className="admin-card p-16 text-center">
                    <span className="text-text-tertiary">Đang tải cài đặt...</span>
                </div>
            ) : error ? (
                <div className="admin-card p-16 text-center">
                    <p className="text-text-secondary font-medium">{getErrorMessage(error, 'Không thể tải cài đặt')}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <Section title="Thông tin chung">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="companyName" className={label}>Tên công ty <span className="text-error">*</span></label>
                                <input id="companyName" value={form.companyName} onChange={set('companyName')} className={`${input} mt-2`} />
                            </div>
                            <div>
                                <label htmlFor="tagline" className={label}>Slogan</label>
                                <input id="tagline" value={form.tagline} onChange={set('tagline')} placeholder="Thảo dược thiên nhiên" className={`${input} mt-2`} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className={label}>Mô tả ngắn (footer)</label>
                            <textarea id="description" value={form.description} onChange={set('description')} rows={3} className={`${input} mt-2 resize-y`} />
                        </div>
                        <div>
                            <label htmlFor="about" className={label}>Giới thiệu công ty</label>
                            <textarea id="about" value={form.about} onChange={set('about')} rows={5} className={`${input} mt-2 resize-y`} />
                        </div>
                    </Section>

                    <Section title="Liên hệ">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="hotline" className={label}>Hotline</label>
                                <input id="hotline" value={form.hotline} onChange={set('hotline')} placeholder="1900 636 848" className={`${input} mt-2`} />
                            </div>
                            <div>
                                <label htmlFor="phone" className={label}>Điện thoại</label>
                                <input id="phone" value={form.phone} onChange={set('phone')} className={`${input} mt-2`} />
                            </div>
                            <div>
                                <label htmlFor="email" className={label}>Email</label>
                                <input id="email" type="email" value={form.email} onChange={set('email')} placeholder="lienhe@locherbal.vn" className={`${input} mt-2`} />
                            </div>
                            <div>
                                <label htmlFor="workingHours" className={label}>Giờ làm việc</label>
                                <input id="workingHours" value={form.workingHours} onChange={set('workingHours')} placeholder="T2-T6: 08:00-17:00" className={`${input} mt-2`} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="address" className={label}>Địa chỉ</label>
                            <input id="address" value={form.address} onChange={set('address')} className={`${input} mt-2`} />
                        </div>
                    </Section>

                    <Section title="Mạng xã hội">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="facebookUrl" className={label}>Facebook URL</label>
                                <input id="facebookUrl" type="url" value={form.facebookUrl} onChange={set('facebookUrl')} className={`${input} mt-2`} />
                            </div>
                            <div>
                                <label htmlFor="youtubeUrl" className={label}>YouTube URL</label>
                                <input id="youtubeUrl" type="url" value={form.youtubeUrl} onChange={set('youtubeUrl')} className={`${input} mt-2`} />
                            </div>
                            <div>
                                <label htmlFor="zaloUrl" className={label}>Zalo URL</label>
                                <input id="zaloUrl" type="url" value={form.zaloUrl} onChange={set('zaloUrl')} className={`${input} mt-2`} />
                            </div>
                        </div>
                    </Section>

                    <Section title="Pháp lý">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label htmlFor="websiteUrl" className={label}>Website URL</label>
                                <input id="websiteUrl" type="url" value={form.websiteUrl} onChange={set('websiteUrl')} className={`${input} mt-2`} />
                            </div>
                            <div>
                                <label htmlFor="taxCode" className={label}>Mã số thuế</label>
                                <input id="taxCode" value={form.taxCode} onChange={set('taxCode')} className={`${input} mt-2`} />
                            </div>
                            <div>
                                <label htmlFor="businessLicense" className={label}>ĐKKD / Giấy phép</label>
                                <input id="businessLicense" value={form.businessLicense} onChange={set('businessLicense')} className={`${input} mt-2`} />
                            </div>
                        </div>
                    </Section>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="admin-btn admin-btn-primary !px-8 !py-3 !rounded-xl"
                        >
                            {mutation.isPending && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                            Lưu cài đặt
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
}