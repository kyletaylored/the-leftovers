/**
 * Converts the supplied display TTF to WOFF2.
 *
 * Run: npm run font  (only needed if the .ttf is ever replaced)
 *
 * Astro's local font provider serves the file it's given rather than
 * transcoding it, and the .ttf was 31KB versus 19KB for the same glyphs in
 * woff2 — worth doing for a face that loads on every page.
 *
 * Further win available if this ever matters: subsetting to the characters in
 * "THE LEFTOVERS" would cut it again, but needs a font toolchain (fonttools)
 * that isn't a dependency here.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import wawoff2 from 'wawoff2';

const src = new URL('../src/assets/fonts/MonsterMashMedium.ttf', import.meta.url);
const out = new URL('../src/assets/fonts/MonsterMashMedium.woff2', import.meta.url);

const ttf = readFileSync(src);
const woff2 = Buffer.from(await wawoff2.compress(ttf));
writeFileSync(out, woff2);

console.log(
  `MonsterMashMedium: ${(ttf.length / 1024).toFixed(0)}KB ttf -> ${(woff2.length / 1024).toFixed(0)}KB woff2`
);
