/**
 * Generates public/og-default.png — the fallback social card (PRD §10.3).
 *
 * Run with `npm run og` after changing the brand art. It's committed as a
 * static file rather than generated per build: the fallback card never
 * changes between deploys, so re-rendering it every build would be waste.
 *
 * The card recomposes the homepage hero lockup (topo texture, ruyi clouds,
 * lanterns, terraced ridge, mascot, wordmark) so the share preview and the
 * page a visitor lands on are unmistakably the same brand.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const W = 1200;
const H = 630;

// Reuse the real topo tile so the card can't drift from the site's texture.
const topo = readFileSync(new URL('../public/img/topo.svg', import.meta.url), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '')
  .replace(/^<svg[^>]*>/, '<g transform="scale(1.7)" opacity="0.9">')
  .replace(/<\/svg>\s*$/, '</g>');

/** Deterministic ridge, same construction as the TerracedDivider component. */
const ridge = (() => {
  const peaks = 11;
  const r = (n) => {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const pts = [[0, 500]];
  for (let i = 0; i < peaks; i++) {
    pts.push([((i + 0.5) / peaks) * W, 440 + r(i) * 55], [((i + 1) / peaks) * W, 510 + r(i + 40) * 35]);
  }
  pts.push([W, 500]);
  return pts.map(([x, y]) => `${x.toFixed(0)},${y.toFixed(0)}`).join(' ');
})();

/** Ruyi-cloud cluster built from overlapping puffs. */
const cloud = (cx, cy, s, flip = false) => {
  const puffs = [
    [-120, 10, 58], [-58, -18, 72], [16, -30, 84], [92, -8, 66], [150, 14, 50],
    [-160, 34, 40], [-20, 36, 62], [70, 40, 54],
  ];
  const body = puffs
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
    .join('');
  const swirls = [[-58, -10], [16, -22], [92, 0]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="#0B0A08" stroke-opacity="0.45" stroke-width="7"/>`)
    .join('');
  return `<g transform="translate(${cx} ${cy}) scale(${flip ? -s : s} ${s})" fill="#8B1E2B">
    ${body}<rect x="-200" y="-120" width="400" height="60" />${swirls}</g>`;
};

const lantern = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#C9A227" stroke-width="5" fill="none">
  <line x1="30" y1="0" x2="30" y2="70"/>
  <rect x="20" y="70" width="20" height="8" rx="2"/>
  <ellipse cx="30" cy="106" rx="24" ry="29" fill="#2E4A34" fill-opacity="0.9"/>
  <line x1="14" y1="88" x2="46" y2="88"/><line x1="10" y1="106" x2="50" y2="106"/><line x1="14" y1="124" x2="46" y2="124"/>
  <rect x="20" y="134" width="20" height="8" rx="2"/>
  <line x1="30" y1="142" x2="30" y2="164"/>
</g>`;

/**
 * The takeout-box mascot. Geometry is kept in lockstep with
 * src/components/brand/Mascot.astro — change one, change both.
 */
const mascot = `<g transform="translate(140 132) scale(1.62)">
  <g stroke="#9A958C" stroke-width="6" fill="none" opacity="0.8" stroke-linecap="round">
    <path d="M104 52c-15-9-15-23 0-32s15-23 0-32"/>
  </g>
  <g transform="rotate(-30 70 90)" stroke="#0B0A08" stroke-width="4">
    <rect x="24" y="20" width="10" height="96" rx="5" fill="#8B1E2B"/>
    <rect x="41" y="12" width="10" height="104" rx="5" fill="#8B1E2B"/>
  </g>
  <g stroke="#0B0A08" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M58 108 26 80l36-11 32 29Z" fill="#F7F5F0"/>
    <path d="M142 108l32-28-36-11-32 29Z" fill="#F7F5F0"/>
    <path d="M64 108c-3-27 14-46 36-46s39 19 36 46Z" fill="#E9C979"/>
    <g fill="none" stroke-width="3.4">
      <path d="M74 102c-3-17 8-29 22-30"/>
      <path d="M90 104c-4-15 2-26 15-28"/>
      <path d="M108 104c1-13 7-21 17-21"/>
    </g>
    <path d="M54 106h92l-13 112H67Z" fill="#F7F5F0"/>
    <path d="M54 106l18 20h56l18-20" fill="none"/>
  </g>
  <rect x="85" y="148" width="30" height="46" rx="3" fill="#8B1E2B" stroke="#0B0A08" stroke-width="3"/>
</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0B0A08"/>
  ${topo}
  ${cloud(70, 40, 0.85)}
  ${cloud(1140, 46, 0.85, true)}
  ${lantern(300, -20, 0.8)}
  ${lantern(1010, -30, 0.7)}
  <polygon points="0,${H} ${ridge} ${W},${H}" fill="#2E4A34"/>
  <polyline points="${ridge}" fill="none" stroke="#C9A227" stroke-width="4"/>
  ${mascot}
  <g transform="skewX(-8) translate(60 0)" fill="#A32534"
     font-family="Impact, Haettenschweiler, 'Arial Black', sans-serif" letter-spacing="3">
    <text x="500" y="270" font-size="104">THE</text>
    <text x="470" y="390" font-size="134">LEFTOVERS</text>
  </g>
  <text x="1140" y="445" text-anchor="end" fill="#F4F1EA"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="bold"
    font-size="21" letter-spacing="8">PLAY / COMPETE / LEFTOVERS</text>
</svg>`;

const out = new URL('../public/og-default.png', import.meta.url);
const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer();
writeFileSync(out, buf);
console.log(`wrote og-default.png (${(buf.length / 1024).toFixed(0)} KB)`);
