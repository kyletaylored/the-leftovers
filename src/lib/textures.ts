/**
 * The repeatable background textures as data. Each is a CSS utility in
 * src/styles/global.css backed by an SVG tile in public/img/. The /design
 * page and the Storybook "Foundations/Textures" story both render from this
 * list.
 *
 * - `textSafe: true` is low-contrast enough to sit behind body text.
 * - `textSafe: false` is decorative only: panels, dividers, OG art.
 * - `tone` is set when <Section tone="…"> accepts the texture.
 *
 * sand and seigaiha tiles come from scripts/make-pattern-tiles.mjs. Edit the
 * script and re-run it; don't hand-edit the SVGs.
 */
export interface Texture {
  className: string;
  tile: string;
  textSafe: boolean;
  tone?: 'topo' | 'sand' | 'seigaiha';
  use: string;
}

export const textures: Texture[] = [
  { className: 'bg-topo', tile: '/img/topo.svg', textSafe: true, tone: 'topo', use: 'Topographic contours. The default quiet texture (hero, FeatureRow fallback).' },
  { className: 'bg-sand', tile: '/img/sand.svg', textSafe: true, tone: 'sand', use: 'Raked sand. Calm sections: about, story, FAQ.' },
  { className: 'bg-sand-bold', tile: '/img/sand-bold.svg', textSafe: false, use: 'Full-gold raked sand. Decorative panels only.' },
  { className: 'bg-seigaiha', tile: '/img/seigaiha.svg', textSafe: true, tone: 'seigaiha', use: 'Wave scales. Event / schedule sections, footer bands.' },
  { className: 'bg-seigaiha-bold', tile: '/img/seigaiha-bold.svg', textSafe: false, use: 'Full-gold wave scales. Thin dividers and accent strips.' },
];
