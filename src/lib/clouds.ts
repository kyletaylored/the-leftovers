/* -------------------------------------------------------------------------
 * Ruyi cloud motifs.
 *
 * Source art: "Ancient Pattern Vectors by Vecteezy"
 * https://www.vecteezy.com/free-vector/ancient-pattern
 * Vecteezy's free licence requires attribution, which is rendered in the site
 * footer and recorded in ATTRIBUTIONS.md. Do not remove either.
 *
 * The files ship with a hardcoded red fill (rgb(209,32,38)) and
 * width/height="100%". Both are stripped here so the motif inherits
 * `currentColor` and is sized entirely by CSS — which is what lets one asset
 * serve the crimson hero clouds, the darker shadow clouds on the CTA strips,
 * and anything else later, without duplicating files per colour.
 * ---------------------------------------------------------------------- */

const sources = import.meta.glob<string>('/src/assets/clouds/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export type CloudVariant = 1 | 2 | 3 | 4 | 5 | 6;

/** Strip the XML prolog/doctype and hand back just the <svg> element. */
function sanitize(raw: string): { viewBox: string; body: string } {
  const svg = raw
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .trim();

  const open = svg.match(/<svg([\s\S]*?)>/);
  if (!open) throw new Error('[clouds] could not parse an <svg> element');

  const body = svg
    .replace(/<svg[\s\S]*?>/, '')
    .replace(/<\/svg>\s*$/, '')
    // Recolour: the art is a single path with an inline red fill.
    .replace(/fill\s*:\s*rgb\(\s*209\s*,\s*32\s*,\s*38\s*\)/gi, 'fill:currentColor')
    .replace(/fill\s*=\s*"#?[dD]12026"/g, 'fill="currentColor"');

  // Keep only viewBox; drop the 100% width/height so CSS owns sizing.
  const viewBox = open[1].match(/viewBox\s*=\s*"([^"]+)"/)?.[1] ?? '0 0 1200 600';

  return { viewBox, body };
}

const cache = new Map<number, { viewBox: string; body: string }>();

export function getCloud(variant: CloudVariant) {
  if (!cache.has(variant)) {
    const key = `/src/assets/clouds/ruyi-cloud-${variant}.svg`;
    const raw = sources[key];
    if (!raw) throw new Error(`[clouds] missing asset: ${key}`);
    cache.set(variant, sanitize(raw));
  }
  return cache.get(variant)!;
}

export const CLOUD_VARIANTS: CloudVariant[] = [1, 2, 3, 4, 5, 6];

export const CLOUD_ATTRIBUTION = {
  label: 'Ancient Pattern Vectors by Vecteezy',
  href: 'https://www.vecteezy.com/free-vector/ancient-pattern',
} as const;
