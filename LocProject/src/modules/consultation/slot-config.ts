/**
 * Giờ làm việc tư vấn — NGÀY NGHỈ + QUY ĐỊNH:
 *  - Thứ 2 → Thứ 6 (getDay 1..5):  08:00 – 17:00 (slot cuối 16:00)
 *  - Thứ 7 (getDay 6):             08:00 – 12:00 (slot cuối 11:00)
 *  - Chủ nhật (getDay 0):          ĐÓNG CỬA (không có slot)
 * Slot tạo theo giờ chẵn, mỗi tư vấn kéo dài 1 giờ.
 */
export const WEEKLY_SLOT_HOURS: Record<number, { from: number; to: number } | null> = {
    0: null, // CN
    1: { from: 8, to: 17 },
    2: { from: 8, to: 17 },
    3: { from: 8, to: 17 },
    4: { from: 8, to: 17 },
    5: { from: 8, to: 17 },
    6: { from: 8, to: 12 }, // T7
};

export interface SlotTime {
    hour: number;
    label: string;
}

/** Sinh danh sách khung giờ trong ngày theo getDay() (0=CN..6=T7). */
export function getSlotsForDate(date: Date): SlotTime[] {
    const cfg = WEEKLY_SLOT_HOURS[date.getDay()];
    if (!cfg) return [];
    const slots: SlotTime[] = [];
    for (let h = cfg.from; h < cfg.to; h++) {
        slots.push({ hour: h, label: `${String(h).padStart(2, '0')}:00` });
    }
    return slots;
}

/** Lịch tư vấn chỉ nhận từ hôm nay trở đi, tối đa X ngày tới. */
export const MAX_BOOKING_DAYS_AHEAD = 14;

/** Khoảng thời gian hiển thị giờ làm việc trên UI (đồng bộ BẢNG CREATE_DO). */
export function formatWorkingHours(): string {
    return 'T2-T6: 08:00-17:00; T7: 08:00-12:00; CN: Nghỉ';
}