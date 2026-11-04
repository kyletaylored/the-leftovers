/**
 * Generates public/og-default.png — the default social share card (PRD §10.3).
 *
 * Run `npm run build && npm run og` after changing the brand art or the card,
 * then commit the PNG. It's a committed static file rather than generated per
 * deploy: the fallback card rarely changes, and a screenshot step in CI would
 * add a browser to every deploy for no benefit.
 *
 * Nov 2026: the card is no longer redrawn here by hand (that version drifted
 * into a hand-drawn mascot and the old zigzag ridge). It is rendered by the
 * real components on src/pages/design/og-card.astro, and this script only
 * serves the built `dist/` and screenshots that page at exactly 1200×630.
 */
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const out = fileURLToPath(new URL('../public/og-default.png', import.meta.url));
const PAGE = '/design/og-card';

if (!existsSync(join(root, 'design', 'og-card.html'))) {
  console.error('dist/design/og-card.html not found. Run `npm run build` first.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

// Minimal static server for dist/, mirroring `build.format: 'file'`
// (/design/og-card → design/og-card.html).
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const candidates = [path, `${path}.html`, join(path, 'index.html')];
  for (const rel of candidates) {
    const file = join(root, rel);
    if (!file.startsWith(root) || !existsSync(file)) continue;
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
      return;
    } catch {
      // A directory; try the next candidate.
    }
  }
  res.writeHead(404).end();
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}${PAGE}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const shot = await page.locator('#card').screenshot({ type: 'png' });
  const png = await sharp(shot).png({ compressionLevel: 9, palette: true, quality: 90, dither: 0.6 }).toBuffer();
  await writeFile(out, png);
  console.log(`wrote public/og-default.png (${(png.length / 1024).toFixed(0)} KB, 1200×630)`);
} finally {
  await browser.close();
  server.close();
}
