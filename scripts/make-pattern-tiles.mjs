/**
 * Generates the seamless background tiles behind the .bg-sand* and
 * .bg-seigaiha* utilities (src/styles/global.css):
 *
 *   public/img/sand.svg          subtle, safe behind body text
 *   public/img/sand-bold.svg     full-strength, decorative only
 *   public/img/seigaiha.svg      subtle, safe behind body text
 *   public/img/seigaiha-bold.svg full-strength, decorative only
 *
 * They're the repeatable versions of the one-off source art in
 * src/assets/img/brand/ (golden-contour-waves.png, seigaiha.png). Re-run after
 * editing, and never hand-edit the SVGs:
 *
 *   node scripts/make-pattern-tiles.mjs
 */
import { writeFileSync } from 'node:fs';

const INK = '#0B0A08'; // --color-ink
const GOLD = '#C9A227'; // --color-gold

const r = (n) => Math.round(n * 10) / 10;

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
  <rect width="${w}" height="${h}" fill="${INK}"/>
  ${body}
</svg>
`;
}

/* ------------------------------------------------------------------ sand --
 * Zen-garden raking: combed wave lines with ripple rings around "stones".
 *
 * How it tiles:
 * - Waves: y = y0 + SLOPE·x + f(x), where f has period T. The y0 values are
 *   multiples of the line spacing, the spacing divides T, and SLOPE·T is a
 *   whole number of spacings, so the tile wraps on both axes.
 * - Stones: each ring set is also drawn at ±T offsets wherever it crosses an
 *   edge. Every copy is drawn in the same order, so the overlaps match across
 *   the seam. Each stone gets an ink disc underneath, which hides the waves
 *   behind it, like rings raked over the comb lines.
 */
function sand(opacity) {
  const T = 600; // tile size (px)
  const S = 20; // line spacing; must divide T
  const SLOPE = -0.3; // diagonal drift; SLOPE * T must be a multiple of S
  if (T % S !== 0) throw new Error('S must divide T');
  if ((SLOPE * T) % S !== 0) throw new Error('SLOPE * T must be a multiple of S');

  const wave = (x) =>
    SLOPE * x + 70 * Math.sin((2 * Math.PI * x) / T) + 18 * Math.sin((4 * Math.PI * x) / T + 1.1);

  const waves = [];
  for (let y0 = -6 * S; y0 <= T - SLOPE * T + 6 * S; y0 += S) {
    let d = `M0,${r(y0 + wave(0))}`;
    for (let x = 10; x <= T; x += 10) d += ` L${x},${r(y0 + wave(x))}`;
    waves.push(`<path d="${d}"/>`);
  }

  // Stones, drawn back to front. Ring radii are multiples of S.
  const stones = [
    { cx: 430, cy: 400, rings: 9 },
    { cx: 120, cy: 150, rings: 6 },
  ];
  const rings = stones.map(({ cx, cy, rings: n }) => {
    const R = n * S + S / 2; // outer edge of the ink disc
    const out = [];
    for (const dx of [-T, 0, T]) {
      for (const dy of [-T, 0, T]) {
        const x = cx + dx;
        const y = cy + dy;
        if (x + R < 0 || x - R > T || y + R < 0 || y - R > T) continue;
        out.push(`<circle cx="${x}" cy="${y}" r="${R}" fill="${INK}" stroke="none"/>`);
        for (let i = 1; i <= n; i++) out.push(`<circle cx="${x}" cy="${y}" r="${i * S}"/>`);
      }
    }
    return out.join('');
  });

  return svg(
    T,
    T,
    `<g fill="none" stroke="${GOLD}" stroke-width="1.3" stroke-opacity="${opacity}">
    ${waves.join('\n    ')}
    ${rings.join('\n    ')}
  </g>`
  );
}

/* -------------------------------------------------------------- seigaiha --
 * 青海波, "waves of the blue sea": overlapping fans of concentric arcs.
 *
 * Scale centres sit on a lattice: row j is at y = j·R/2, and odd rows shift
 * right by R. The pattern repeats every 2R across and R down. Rows are drawn
 * top to bottom, and each scale's ink disc covers the lower half of the row
 * above, which leaves the fan shapes. The tile is a window onto that infinite
 * lattice, drawn in the same global order, so it wraps seamlessly.
 */
function seigaiha(opacity) {
  const R = 48; // scale radius; tile is 2R × R
  const RINGS = 4; // arcs per scale, outermost first
  const SW = 3; // stroke width
  const W = 2 * R;
  const H = R;

  const out = [];
  for (let j = -2; j <= (H + R) / (R / 2); j++) {
    const y = (j * R) / 2;
    for (let i = -1; i <= 2; i++) {
      const x = i * 2 * R + (Math.abs(j) % 2 ? R : 0);
      if (x + R < 0 || x - R > W) continue;
      out.push(`<circle cx="${x}" cy="${y}" r="${R}" fill="${INK}" stroke="none"/>`);
      for (let k = 0; k < RINGS; k++) {
        out.push(`<circle cx="${x}" cy="${y}" r="${r(R - SW / 2 - (k * R) / RINGS)}"/>`);
      }
    }
  }

  return svg(
    W,
    H,
    `<g fill="none" stroke="${GOLD}" stroke-width="${SW}" stroke-opacity="${opacity}">
    ${out.join('\n    ')}
  </g>`
  );
}

const files = {
  'sand.svg': sand(0.16),
  'sand-bold.svg': sand(0.9),
  'seigaiha.svg': seigaiha(0.09),
  'seigaiha-bold.svg': seigaiha(0.85),
};
for (const [name, content] of Object.entries(files)) {
  writeFileSync(new URL(`../public/img/${name}`, import.meta.url), content);
}
console.log(`wrote ${Object.keys(files).map((f) => `public/img/${f}`).join(', ')}`);
