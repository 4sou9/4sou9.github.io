// Renders the social card by running the page's own shader on the CPU: the same
// gyroid field, the same Bayer dither, so the card and the site cannot drift.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const W = 600;              // rendered at half size, doubled with nearest
const H = 315;              // neighbour so the dither stays a crisp 2px grid
const TIME = 11.4;          // a rotation that shows the lattice off well
const SHIFT = [0.54, -0.02];
const STEPS = 96;

const rot = (x, y, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [c * x - s * y, s * x + c * y];
};

function gyroid(px, py, pz, s, t) {
  const x = px * s, y = py * s, z = pz * s;
  const d =
    Math.sin(x) * Math.cos(z) +
    Math.sin(y) * Math.cos(x) +
    Math.sin(z) * Math.cos(y);
  return Math.abs(d) / s - t;
}

function map(px, py, pz) {
  let qx = px, qy = py, qz = pz;
  [qx, qz] = rot(qx, qz, TIME * 0.075);
  [qx, qy] = rot(qx, qy, TIME * 0.048);

  const r = Math.hypot(px, py, pz);
  const shell = r - 1.02;

  let g = gyroid(qx, qy, qz, 5.6, 0.021);
  const g2 = gyroid(qx + 1.7, qy + 1.7, qz + 1.7, 13.2, 0.012);
  const g3 = gyroid(qx - 4.2, qy - 4.2, qz - 4.2, 31.0, 0.006);
  g -= g2 * 0.055;
  g += g3 * 0.02;

  let d = Math.max(shell, g);
  d = Math.max(d, -(r - 0.58));
  return d * 0.5;
}

function normal(px, py, pz) {
  const e = 0.0016;
  const nx = map(px + e, py, pz) - map(px - e, py, pz);
  const ny = map(px, py + e, pz) - map(px, py - e, pz);
  const nz = map(px, py, pz + e) - map(px, py, pz - e);
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

function bayer(x, y) {
  let bx = (x ^ y) & 7, by = y & 7, v = 0;
  for (let i = 2; i >= 0; i--) v = (v << 2) | (((bx >> i) & 1) << 1) | ((by >> i) & 1);
  return v;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const px = Buffer.alloc(W * H * 3);
const LEVELS = 4;

for (let iy = 0; iy < H; iy++) {
  for (let ix = 0; ix < W; ix++) {
    let uvx = (ix * 2 - W) / H;
    let uvy = ((H - 1 - iy) * 2 - H) / H;
    const vx = uvx, vy = uvy;
    uvx -= SHIFT[0];
    uvy -= SHIFT[1];

    const ro = [0, 0, 3.95];
    const fw = [0, 0, -1];
    // Camera basis is axis aligned here, so the ray simplifies.
    let rdx = uvx, rdy = uvy, rdz = -1.55;
    const rl = Math.hypot(rdx, rdy, rdz);
    rdx /= rl; rdy /= rl; rdz /= rl;

    let t = 0, hit = false, wander = 0;
    for (let i = 0; i < STEPS; i++) {
      const d = map(ro[0] + rdx * t, ro[1] + rdy * t, ro[2] + rdz * t);
      if (d < 0.0012) { hit = true; break; }
      if (t > 6) break;
      t += d;
      wander++;
    }

    let lum = 1;
    if (hit) {
      const [nx, ny, nz] = normal(ro[0] + rdx * t, ro[1] + rdy * t, ro[2] + rdz * t);
      const ll = Math.hypot(0.55, 0.82, 0.42);
      const lx = 0.55 / ll, ly = 0.82 / ll, lz = 0.42 / ll;
      const nd = nx * lx + ny * ly + nz * lz;
      const diff = clamp(nd, 0, 1);
      const wrap = clamp(nd * 0.5 + 0.5, 0, 1);
      const fres = Math.pow(1 - clamp(-(nx * rdx + ny * rdy + nz * rdz), 0, 1), 3.5);
      const ao = clamp(1 - (wander / STEPS) * 1.35, 0, 1);
      let ink = 0.05 + diff * 0.4 + wrap * 0.14 + fres * 0.46;
      ink *= 0.42 + 0.58 * ao;
      lum = clamp(ink, 0, 1);
      lum = lum + (1 - lum) * smoothstep(3.0, 5.6, t);
    }

    const th = (bayer(ix, iy) + 0.5) / 64 - 0.5;
    const q = clamp(Math.floor(lum * LEVELS + th + 0.5) / LEVELS, 0, 1);
    const wash = 1 - (vx * vx + vy * vy) * 0.018 - vy * 0.012;

    const o = (iy * W + ix) * 3;
    px[o] = clamp(q * wash * 0.985, 0, 1) * 255;
    px[o + 1] = clamp(q * wash * 0.98, 0, 1) * 255;
    px[o + 2] = clamp(q * wash * 0.96, 0, 1) * 255;
  }
}

const base = await sharp(px, { raw: { width: W, height: H, channels: 3 } })
  .resize(W * 2, H * 2, { kernel: 'nearest' })
  .png()
  .toBuffer();

const INK = '#16161a';
const GOTHIC = 'Yu Gothic, BIZ UDGothic, Meiryo, sans-serif';
const SERIF = 'Instrument Serif, Times New Roman, Georgia, serif';

// The card carries what the page carries: two rules, the headline, one line.
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <g stroke="${INK}" stroke-opacity="0.22" stroke-width="2">
    <line x1="72" y1="86" x2="1128" y2="86"/>
    <line x1="72" y1="544" x2="1128" y2="544"/>
  </g>
  <g fill="${INK}" font-family="${SERIF}" font-size="132">
    <text x="68" y="300">Nothing</text>
    <text x="68" y="413" font-style="italic">in Particular</text>
  </g>
  <text x="72" y="470" fill="${INK}" fill-opacity="0.7"
        font-family="${GOTHIC}" font-size="18" letter-spacing="3">なんか書いとけ</text>
</svg>`;

await writeFile(
  'public/og.png',
  await sharp(base)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer()
);
console.log('og.png written');
