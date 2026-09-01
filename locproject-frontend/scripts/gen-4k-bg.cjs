// Tạo background 4K (3840x2160) dạng vector -> webp
// Phong cách: line-art thực vật (sketch) trên nền sage gradient đồng nhất
const sharp = require('sharp');
const path = require('path');

const W = 3840, H = 2160;
const STROKE = '#64775f';      // xanh xám mờ chủ đạo
const STROKE2 = '#7d8f78';     // nhánh phụ sáng hơn
const PETAL = '#f7f9f4';       // trắng ngà cho cánh hoa

// ---- Hoa cúc (daisy) sketch: cánh ellipse + nhụy ----
function daisy(x, y, r, rot = 0, petals = 12) {
    let s = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${r / 100})">`;
    for (let i = 0; i < petals; i++) {
        s += `<ellipse cx="0" cy="-58" rx="16" ry="46" transform="rotate(${(360 / petals) * i})"
               fill="${PETAL}" fill-opacity="0.85" stroke="${STROKE}" stroke-width="4" stroke-opacity="0.65"/>`;
    }
    s += `<circle r="17" fill="#e9e2c8" fill-opacity="0.9" stroke="${STROKE}" stroke-width="4" stroke-opacity="0.6"/></g>`;
    return s;
}

// ---- Cành lá: thân cong bezier + các lá bám sát thân ----
function branch(x, y, len, rot, scale = 1, flip = 1, op = 0.55) {
    let s = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${flip * scale} ${scale})" opacity="${op}">`;
    const Cx = len * 0.3, Cy = -len * 0.55, Ex = len, Ey = -len * 0.95;
    s += `<path d="M0 0 Q ${Cx} ${Cy} ${Ex} ${Ey}"
          fill="none" stroke="${STROKE}" stroke-width="5" stroke-linecap="round"/>`;
    // lá đặt đúng trên đường cong quadratic: B(t) = (1-t)^2 P0 + 2(1-t)t C + t^2 P1
    const n = 8;
    for (let i = 1; i <= n; i++) {
        const t = i / (n + 1);
        const mt = 1 - t;
        const px = 2 * mt * t * Cx + t * t * Ex;
        const py = 2 * mt * t * Cy + t * t * Ey;
        // tiếp tuyến của đường cong để lá xoay theo thân
        const dx = 2 * mt * (Cx) + 2 * t * (Ex - Cx);
        const dy = 2 * mt * (Cy) + 2 * t * (Ey - Cy);
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const side = i % 2 === 0 ? 1 : -1;
        const lsz = 210 * (1 - 0.45 * t);
        s += `<g transform="translate(${px} ${py}) rotate(${ang})">
              <path d="M0 0 q ${lsz * 0.25 * side} ${-lsz * 0.75} ${lsz * side} ${-lsz * 0.22} q ${-lsz * 0.35 * side} ${lsz * 0.5} ${-lsz * side} ${lsz * 0.22} Z"
              fill="${PETAL}" fill-opacity="0.55" stroke="${STROKE2}" stroke-width="6" stroke-opacity="0.75"/>
              <path d="M0 0 L ${lsz * 0.85 * side} ${-lsz * 0.22}" fill="none" stroke="${STROKE2}" stroke-width="3" stroke-opacity="0.6"/>
              </g>`;
    }
    // chồi non đầu cành
    s += `<path d="M${Ex} ${Ey} q ${45} ${-70} ${140} ${-80}" fill="none" stroke="${STROKE2}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.7"/>`;
    s += `<path d="M${Ex + 30} ${Ey - 40} q ${20} ${-60} ${90} ${-75}" fill="none" stroke="${STROKE2}" stroke-width="5" stroke-linecap="round" stroke-opacity="0.55"/>`;
    s += `</g>`;
    return s;
}

function leaf(x, y, rot, scale = 1, op = 0.4) {
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})" opacity="${op}">
        <path d="M0 0 Q 55 -130 210 -165 Q 110 -40 0 0 Z" fill="${PETAL}" fill-opacity="0.55"
              stroke="${STROKE2}" stroke-width="7" stroke-opacity="0.8"/>
        <path d="M0 0 Q 105 -95 210 -165" fill="none" stroke="${STROKE2}" stroke-width="5" stroke-opacity="0.7"/>
        <path d="M30 -28 Q 120 -75 185 -140 M60 -48 Q 130 -85 175 -125" fill="none" stroke="${STROKE2}" stroke-width="3" stroke-opacity="0.45"/>
    </g>`;
}


// ---- Bố cục tổng thể: góc dày đặc, giữa thoáng (chừa chỗ cho card) ----
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#edf1e9"/>
      <stop offset="0.5" stop-color="#dde5d8"/>
      <stop offset="1" stop-color="#ccd6c8"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#f2f4ee" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#f2f4ee" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#base)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Góc trên trái -->
  ${branch(-80, 260, 1250, -8, 1.15, 1, 0.6)}
  ${branch(-120, 60, 1050, 24, 1.0, 1, 0.5)}
  ${daisy(430, 300, 120, 12)}
  ${daisy(240, 120, 85, -18, 10)}
  ${daisy(680, 150, 70, 30, 10)}
  ${leaf(760, 420, 35, 1.3, 0.45)}

  <!-- Góc trên phải -->
  ${branch(W + 80, 240, 1250, 188, 1.15, 1, 0.6)}
  ${branch(W + 120, 50, 1050, 156, 1.0, 1, 0.5)}
  ${daisy(W - 430, 310, 118, 100)}
  ${daisy(W - 230, 130, 88, 64, 10)}
  ${daisy(W - 690, 170, 68, 130, 10)}
  ${leaf(W - 780, 430, 145, 1.3, 0.45)}

  <!-- Góc dưới trái: cành vươn lên ôm sát góc -->
  ${branch(-100, H - 40, 1250, -35, 1.25, 1, 0.6)}
  ${branch(-160, H - 120, 1000, -12, 1.0, 1, 0.45)}
  ${daisy(520, H - 260, 110, 8)}
  ${daisy(300, H - 120, 90, -14, 10)}
  ${daisy(760, H - 110, 72, 22, 10)}
  ${daisy(120, H - 420, 78, 40, 11)}
  ${daisy(80, H - 150, 95, -30, 12)}
  ${leaf(880, H - 300, -40, 1.4, 0.5)}
  ${leaf(1050, H - 480, -15, 1.1, 0.4)}

  <!-- Góc dưới phải -->
  ${branch(W + 100, H - 40, 1250, 215, 1.25, 1, 0.6)}
  ${branch(W + 160, H - 120, 1000, 192, 1.0, 1, 0.45)}
  ${daisy(W - 520, H - 270, 112, 95)}
  ${daisy(W - 300, H - 120, 92, 120, 10)}
  ${daisy(W - 760, H - 115, 74, 70, 10)}
  ${daisy(W - 120, H - 430, 80, 150, 11)}
  ${leaf(W - 900, H - 310, 220, 1.4, 0.5)}

  <!-- Điểm nhấn nhẹ hai bên thân (giữ trung tâm thoáng) -->
  ${leaf(180, 1150, 70, 0.9, 0.3)}
  ${leaf(W - 220, 1250, 110, 0.9, 0.3)}
  ${leaf(260, 1500, -25, 0.7, 0.25)}
  ${leaf(W - 300, 1600, 205, 0.7, 0.25)}
</svg>`;

const out = path.join(__dirname, '..', 'public', 'images', 'bg-4k-sage.webp');
sharp(Buffer.from(svg), { density: 96 })
    .webp({ quality: 90 })
    .toFile(out)
    .then((info) => console.log('DONE', info.width + 'x' + info.height, Math.round(info.size / 1024) + ' KB'))
    .catch((e) => { console.error(e); process.exit(1); });
