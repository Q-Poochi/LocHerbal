/**
 * Vectorize decor wallpapers (raster -> SVG) using multi-level potrace tracing.
 *
 * Why: source wallpapers are only 848x1264 (~1MP). Any upscale to desktop/4K
 * will be blurry. Vectorizing the artwork gives infinitely sharp results at
 * any resolution/DPI.
 *
 * Method:
 *  1. Crop the 4 decorative corner clusters from each wallpaper at NATIVE
 *     resolution (no upscale).
 *  2. Trace each cluster with potrace in 3 tonal layers (light/mid/dark),
 *     sampling the actual fill color of each band from the source image.
 *  3. Emit one combined SVG per corner with transparent background.
 *
 * Usage: node scripts/vectorize-decor.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const potrace = require('potrace');

const ROOT = path.join(__dirname, '..');
const DECOR_DIR = path.join(ROOT, 'design-assets', 'decor');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'decor');

// Source wallpapers (portrait 848x1264). Decorations sit in the 4 corners,
// middle is empty gradient.
const SOURCES = [
    {
        key: 'willow',
        file: path.join(DECOR_DIR, 'a_minimalist_mobile_wallpaper_background_inspired_by_data_image_image_2._soft_1', 'screen.png'),
        crops: {
            tl: { left: 0, top: 0, width: 470, height: 400 },
            tr: { left: 400, top: 0, width: 448, height: 460 },
            bl: { left: 0, top: 770, width: 520, height: 494 },
            br: { left: 480, top: 770, width: 368, height: 494 },
        },
    },
    {
        key: 'maple',
        file: path.join(DECOR_DIR, 'a_minimalist_mobile_wallpaper_background_inspired_by_data_image_image_2._soft_2', 'screen.png'),
        crops: {
            tl: { left: 0, top: 0, width: 430, height: 400 },
            tr: { left: 420, top: 0, width: 428, height: 420 },
            bl: { left: 0, top: 820, width: 420, height: 444 },
            br: { left: 400, top: 790, width: 448, height: 474 },
        },
    },
];

const TRACE_SCALE = 2; // upscale crop before tracing for smoother potrace curves

function lum(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

function toHex(r, g, b) {
    const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
}

/** Extract every <path d="..."> from a potrace SVG string. */
function extractPaths(svg) {
    const out = [];
    const re = /<path[^>]*\sd="([^"]+)"/g;
    let m;
    while ((m = re.exec(svg)) !== null) out.push(m[1]);
    return out;
}

function traceLevel(pngBuffer, threshold, turdSize) {
    return new Promise((resolve, reject) => {
        potrace.trace(pngBuffer, {
            threshold,
            turdSize,
            alphaMax: 1.2,
            optCurve: true,
            optTolerance: 0.3,
            blackOnWhite: true,
        }, (err, svg) => (err ? reject(err) : resolve(extractPaths(svg))));
    });
}


async function vectorizeCrop(srcBuffer, crop, label) {
    // 1. Crop + upscale x2 for smoother potrace curves
    const base = sharp(srcBuffer).extract(crop);
    const meta = await base.clone().toBuffer({ resolveWithObject: true });
    const w = meta.info.width;
    const h = meta.info.height;
    const upscaled = await base.clone()
        .resize(w * TRACE_SCALE, h * TRACE_SCALE, { kernel: 'lanczos3' })
        .png()
        .toBuffer();

    // 2. Analyze tones: find background level + band colors from raw pixels
    const raw = await sharp(upscaled).raw().toBuffer({ resolveWithObject: true });
    const data = raw.data;
    const info = raw.info;
    const px = info.channels;
    const lums = [];
    for (let i = 0; i < data.length; i += px) {
        lums.push(lum(data[i], data[i + 1], data[i + 2]));
    }
    lums.sort((a, b) => a - b);
    // background = bright level (90th percentile)
    const bgLum = lums[Math.floor(lums.length * 0.9)];
    const tLight = Math.round(bgLum - 14);
    const tMid = Math.round(bgLum - 55);
    const tDark = Math.round(bgLum - 95);

    // band colors = mean RGB of pixels inside each band
    const bands = { light: [0, 0, 0, 0], mid: [0, 0, 0, 0], dark: [0, 0, 0, 0] };
    for (let i = 0, p = 0; i < data.length; i += px, p++) {
        const L = lum(data[i], data[i + 1], data[i + 2]);
        let band = null;
        if (L < tDark) band = 'dark';
        else if (L < tMid) band = 'mid';
        else if (L < tLight) band = 'light';
        if (band) {
            const acc = bands[band];
            acc[0] += data[i]; acc[1] += data[i + 1]; acc[2] += data[i + 2]; acc[3]++;
        }
    }
    const colorOf = (b) => {
        const acc = bands[b];
        if (!acc[3]) return null;
        return toHex(acc[0] / acc[3], acc[1] / acc[3], acc[2] / acc[3]);
    };
    const colors = { light: colorOf('light'), mid: colorOf('mid'), dark: colorOf('dark') };

    // 3. Trace 3 levels (light first = largest shapes, dark last = on top)
    const layers = [
        { t: tLight, fill: colors.light, turd: 60 },
        { t: tMid, fill: colors.mid || colors.light, turd: 40 },
        { t: tDark, fill: colors.dark || colors.mid || colors.light, turd: 25 },
    ];
    let body = '';
    for (const layer of layers) {
        if (!layer.fill) continue;
        const paths = await traceLevel(upscaled, layer.t, layer.turd);
        if (paths.length) {
            body += `  <g fill="${layer.fill}">\n`;
            for (const d of paths) body += `    <path d="${d}"/>\n`;
            body += '  </g>\n';
        }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * TRACE_SCALE} ${h * TRACE_SCALE}">\n${body}</svg>\n`;
    const bandInfo = Object.entries(colors).map(([k, v]) => `${k}=${v || 'none'}`).join(' ');
    console.log(`  [${label}] bg=${Math.round(bgLum)} t=(${tDark},${tMid},${tLight}) ${bandInfo} size=${(svg.length / 1024).toFixed(1)}KB`);
    return { svg, colors };
}

/** Sample vertical gradient colors (top/bottom/mid) from wallpaper. */
async function sampleGradient(srcBuffer) {
    const raw = await sharp(srcBuffer).resize(64, 96, { fit: 'fill' }).raw()
        .toBuffer({ resolveWithObject: true });
    const data = raw.data;
    const info = raw.info;
    const px = info.channels;
    const bandAvg = (y0, y1) => {
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = y0; y < y1; y++) {
            for (let x = 0; x < info.width; x++) {
                const i = (y * info.width + x) * px;
                r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
            }
        }
        return toHex(r / n, g / n, b / n);
    };
    return {
        top: bandAvg(0, 16),
        mid: bandAvg(40, 56),
        bottom: bandAvg(80, 96),
    };
}

async function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const src of SOURCES) {
        console.log(`\n== ${src.key} ==`);
        const srcBuffer = fs.readFileSync(src.file);
        const gradient = await sampleGradient(srcBuffer);
        console.log(`  gradient: top=${gradient.top} mid=${gradient.mid} bottom=${gradient.bottom}`);
        fs.writeFileSync(path.join(OUT_DIR, `${src.key}-palette.json`), JSON.stringify(gradient, null, 2));

        for (const [corner, crop] of Object.entries(src.crops)) {
            const { svg } = await vectorizeCrop(srcBuffer, crop, `${src.key}-${corner}`);
            const outFile = path.join(OUT_DIR, `${src.key}-${corner}.svg`);
            fs.writeFileSync(outFile, svg);
            console.log(`  -> ${path.relative(ROOT, outFile)}`);
        }
    }
    console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
