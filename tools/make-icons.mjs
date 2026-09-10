// Builds the favicon set from one SVG mark: PNGs via sharp, plus a real .ico
// container (ICO permits embedded PNG payloads, so no BMP encoding needed).
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';

const PAPER = '#eceae4';
const INK = '#16161a';

// A dark plate, a paper disc, and three ink bars: the slab shear of the 404,
// still legible when the whole mark is sixteen pixels wide.
const bars = [11.6, 18]
  .map((y) => `<rect x="3" y="${y}" width="26" height="2.4"/>`)
  .join('');

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${INK}"/>
  <circle cx="16" cy="16" r="11" fill="${PAPER}"/>
  <g fill="${INK}" clip-path="url(#disc)">${bars}</g>
  <clipPath id="disc"><circle cx="16" cy="16" r="11"/></clipPath>
</svg>`;

await mkdir('public/icons', { recursive: true });
await writeFile('public/icons/mark.svg', mark + '\n');

const png = (size) =>
  sharp(Buffer.from(mark), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

for (const size of [32, 180, 192, 512]) {
  await writeFile(`public/icons/mark-${size}.png`, await png(size));
}

// ICO: 6-byte header, then one 16-byte directory entry per image.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);

let offset = 6 + 16 * sizes.length;
const dir = sizes.map((size, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0);
  e.writeUInt8(size === 256 ? 0 : size, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(images[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += images[i].length;
  return e;
});

await writeFile('public/favicon.ico', Buffer.concat([header, ...dir, ...images]));
console.log('icons written');
