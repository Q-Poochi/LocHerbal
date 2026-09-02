'use client';

import { useEffect, useState } from 'react';

type TimeLeft = { h: number; m: number; s: number };

/** Đếm ngược đến 23:59:59 hôm nay */
function getTimeLeft(): TimeLeft {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = Math.max(0, end.getTime() - now.getTime());
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Đồng hồ đếm ngược cho hero banner trang Ưu đãi.
 * - Chỉ chạy useEffect sau mount (tránh hydration mismatch giữa server/client).
 * - Mỗi khi giá trị đổi, span được re-mount (key=value) nên animation flip chạy lại.
 */
export default function CountdownTimer() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const timer = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const units: Array<[string, string]> = [
    [time !== null ? pad(time.h) : '—', 'Giờ'],
    [time !== null ? pad(time.m) : '—', 'Phút'],
    [time !== null ? pad(time.s) : '—', 'Giây'],
  ];

  return (
    <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
      <p className="text-white/70 text-xs mb-2 text-center tracking-[0.15em]">KẾT THÚC SAU</p>
      <div className="flex gap-3">
        {units.map(([n, l]) => (
          <div key={l} className="text-center">
            <div className="text-2xl font-bold text-white tabular-nums" style={{ perspective: '200px' }}>
              <span key={n} className="countdown-flip inline-block">
                {n}
              </span>
            </div>
            <div className="text-white/60 text-xs">{l}</div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes countdown-flip {
          0% { transform: rotateX(-90deg); opacity: 0; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        .countdown-flip {
          animation: countdown-flip 0.35s ease-out;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
