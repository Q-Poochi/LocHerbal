/** Render a desktop preview composing the traced SVG clusters over a CSS-like gradient. */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DECOR = path.join(ROOT, 'public', 'images', 'decor');
const key = process.argv[2] || 'willow';

(async () => {
    const W = 2560, H = 1440, S = 2.6; // render each cluster at 2.6x native size
    const pal = JSON.parse(fs.readFileSync(path.join(DECOR, `${key}-palette.json`)));
    const bgSvg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="${pal.top}"/>` +
        `<stop offset="0.5" stop-color="${pal.mid}"/>` +
        `<stop offset="1" stop-color="${pal.bottom}"/>` +
        `</linearGradient></defs>` +
        `<rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
    const composites = [];
    for (const c of ['tl', 'tr', 'bl', 'br']) {
        let svg = fs.readFileSync(path.join(DECOR, `${key}-${c}.svg`), 'utf8');
        const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
        const vw = +m[1], vh = +m[2];
        const nw = Math.round(vw * S / 2), nh = Math.round(vh * S / 2);
        svg = svg.replace(/<svg /, `<svg width="${nw}" height="${nh}" `);
        const buf = await sharp(Buffer.from(svg)).png().toBuffer();
        const pos = { tl: [0, 0], tr: [W - nw, 0], bl: [0, H - nh], br: [W - nw, H - nh] }[c];
        composites.push({ input: buf, left: pos[0], top: pos[1] });
    }
    await sharp(bgSvg).composite(composites).png()
        .toFile(path.join(ROOT, 'design-assets', `preview-vector-${key}.png`));
    console.log(`preview-vector-${key}.png saved`);
})().catch((e) => { console.error(e); process.exit(1); });
