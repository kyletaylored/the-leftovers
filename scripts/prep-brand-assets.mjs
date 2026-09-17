/**
 * Prepares the official logo + icon for use on the site.
 *
 * Run: npm run brand
 *
 * The supplied art is 2000px square with a lot of transparent padding, which
 * would waste most of the pixels of any rendered size. This trims to the real
 * bounding box, writes optimized masters into src/assets/img/brand (so Astro's
 * <Image> can generate responsive srcsets from them), and builds the favicons
 * — which need compositing onto the dark brand circle, because the mascot is
 * almost entirely light grey and would vanish on a light browser tab.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SRC = new URL('../public/img/', import.meta.url);
const BRAND = new URL('../src/assets/img/brand/', import.meta.url);
const PUBLIC = new URL('../public/', import.meta.url);
mkdirSync(fileURLToPath(BRAND), { recursive: true });

const report = [];

/** Trim fully-transparent edges and report the crop. */
async function trim(name, outName, maxWidth) {
  const input = fileURLToPath(new URL(name, SRC));
  const before = await sharp(input).metadata();

  let pipeline = sharp(input).trim({ threshold: 0 });
  const trimmed = await pipeline.toBuffer({ resolveWithObject: true });

  let out = sharp(trimmed.data);
  const meta = await out.metadata();
  if (maxWidth && meta.width > maxWidth) {
    out = out.resize({ width: maxWidth, withoutEnlargement: true });
  }

  const buf = await out.png({ compressionLevel: 9, palette: true }).toBuffer();
  writeFileSync(fileURLToPath(new URL(outName, BRAND)), buf);
  const after = await sharp(buf).metadata();

  report.push([
    outName,
    `${before.width}x${before.height} -> ${after.width}x${after.height}`,
    `${(buf.length / 1024).toFixed(0)} KB`,
  ]);
  return buf;
}

// Hero lockup. 1400px wide is plenty: it renders at most ~700 CSS px @2x.
await trim('leftovers-logo.png', 'logo.png', 1400);
// Mascot alone, used in the nav, footer and empty states. Never renders large.
const iconBuf = await trim('leftovers-icon.png', 'icon.png', 512);

/**
 * Favicons: the mascot is light grey on transparent, so on its own it
 * disappears against a light tab strip. Composite it onto the brand's
 * near-black disc with a gold ring — the same treatment as the crest.
 */
async function favicon(size, outName) {
  const pad = Math.round(size * 0.1);
  const inner = size - pad * 2;
  const disc = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}"
               fill="#0B0A08" stroke="#C9A227" stroke-width="${Math.max(2, size * 0.04)}"/>
     </svg>`
  );
  const mascot = await sharp(iconBuf)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const buf = await sharp(disc)
    .composite([{ input: mascot, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(fileURLToPath(new URL(outName, PUBLIC)), buf);
  report.push([outName, `${size}x${size}`, `${(buf.length / 1024).toFixed(0)} KB`]);
}

await favicon(32, 'favicon-32.png');
await favicon(180, 'apple-touch-icon.png');

for (const [name, dims, size] of report) {
  console.log(name.padEnd(24), dims.padEnd(26), size.padStart(8));
}
