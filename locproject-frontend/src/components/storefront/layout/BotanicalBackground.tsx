'use client';

/**
 * BotanicalBackground — Premium Editorial Sage (DESIGN.md)
 * - Toàn nền #f8faf9 (đặt qua --background)
 * - 2 cụm cành lá vector gốc ở góc trên-phải và dưới-trái, tỏa chéo vào trong
 * - Mỗi lá: hình thoi nhọn 2 đầu, viền mảnh #526352, fill watercolor #dbe5d8, gân giữa mảnh
 * - Cành mảnh 1-1.5px #4f6050, opacity toàn cụm 22-26% (DESIGN.md 20-30%)
 * - Fixed, z-0, không che nội dung
 */

function Leaf({
  x,
  y,
  angle = 0,
  scale = 1,
  light = false,
}: {
  x: number;
  y: number;
  angle?: number;
  scale?: number;
  light?: boolean;
}) {
  const fill = light ? '#e6ece3' : '#dbe5d8';
  const fillOpacity = light ? 0.55 : 0.68;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      {/* blade — oval nhọn 2 đầu */}
      <path
        d="M0,-14 C 4.5,-9 6.5,-3 0,14 C -6.5,-3 -4.5,-9 0,-14 Z"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke="#526352"
        strokeWidth={0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* gân giữa */}
      <path d="M0,-13 L 0,13" stroke="#526352" strokeWidth={0.55} strokeLinecap="round" opacity={0.9} />
      {/* gân phụ mờ */}
      <path d="M0,0 L -4,-5 M0,2 L 4,-4 M0,5 L -3.5,-2" stroke="#526352" strokeWidth={0.35} opacity={0.45} strokeLinecap="round" />
    </g>
  );
}

function Branch({
  x0,
  y0,
  x1,
  y1,
  leaves = 7,
}: {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  leaves?: number;
}) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <g>
      {/* thân cành — hơi cong nhẹ */}
      <path
        d={`M${x0},${y0} C ${x0 + dx * 0.3 + 8},${y0 + dy * 0.28} ${x0 + dx * 0.65 - 6},${y0 + dy * 0.62} ${x1},${y1}`}
        fill="none"
        stroke="#4f6050"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.95}
      />
      {/* lá mọc so le dọc thân */}
      {Array.from({ length: leaves }).map((_, i) => {
        const t = (i + 1) / (leaves + 1);
        // jitter nhẹ để tự nhiên
        const jx = (i % 2 === 0 ? 1 : -1) * 2;
        const jy = (i % 3 === 1 ? 1 : 0) * 3;
        const x = x0 + dx * t + jx;
        const y = y0 + dy * t + jy;
        const base = ang + 90;
        const leftAngle = base - 28 + (i % 2 === 0 ? 6 : -4);
        const rightAngle = base + 28 + (i % 3 === 0 ? -5 : 5);
        const scale = 0.85 + t * 0.35;
        const light = i % 3 === 1;
        return (
          <g key={i}>
            <Leaf x={x - 7} y={y} angle={leftAngle} scale={scale} light={light} />
            <Leaf x={x + 7} y={y - 1} angle={rightAngle} scale={scale * 0.96} light={!light} />
          </g>
        );
      })}
    </g>
  );
}

function CornerCluster({ mirrored = false }: { mirrored?: boolean }) {
  // Top-right cluster (origin top-right corner inward), mirrored = bottom-left
  return (
    <svg
      viewBox="0 0 420 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={mirrored ? { transform: 'scale(-1, 1) rotate(180deg)' } : undefined}
    >
      <g opacity={0.24}>
        {/* 3 cành chính tỏa lệch */}
        <Branch x0={380} y0={8} x1={90} y1={360} leaves={8} />
        <Branch x0={405} y0={42} x1={165} y1={285} leaves={7} />
        <Branch x0={355} y0={-6} x1={145} y1={195} leaves={6} />
        {/* cành nhỏ phụ */}
        <Branch x0={290} y0={120} x1={195} y1={210} leaves={4} />
        <Branch x0={210} y0={205} x1={125} y1={295} leaves={4} />
        {/* lá rời nhỏ ở ngọn */}
        <Leaf x={78} y={368} angle={-32} scale={0.72} light />
        <Leaf x={98} y={382} angle={28} scale={0.68} />
        <Leaf x={62} y={385} angle={-18} scale={0.62} light />
      </g>
    </svg>
  );
}

export default function BotanicalBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Trên-phải */}
      <div className="absolute -top-2 -right-2 w-[420px] h-[560px] sm:w-[520px] sm:h-[640px] lg:w-[620px] lg:h-[740px]">
        <CornerCluster />
      </div>
      {/* Dưới-trái */}
      <div className="absolute -bottom-2 -left-2 w-[420px] h-[560px] sm:w-[520px] sm:h-[640px] lg:w-[620px] lg:h-[740px]">
        <CornerCluster mirrored />
      </div>
      {/* Cụm nhỏ ở giữa-dưới phải (như ảnh tham khảo có cành nhỏ ở giữa) */}
      <div className="absolute bottom-[28%] -right-1 w-[280px] h-[380px] hidden lg:block opacity-90">
        <svg viewBox="0 0 280 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <g opacity={0.20}>
            <Branch x0={250} y0={10} x1={40} y1={260} leaves={6} />
            <Branch x0={220} y0={60} x1={80} y1={210} leaves={4} />
          </g>
        </svg>
      </div>
    </div>
  );
}
