// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The single source of truth for the site's public origin. Canonical URLs,
 * sitemap.xml, robots.txt and the Open Graph tags all derive from it, so
 * moving hosts is this one line.
 *
 * The custom domain (PRD §13's open question, now settled) serves from the
 * root, which is what keeps GitHub Pages viable without a `base` path — a
 * project page at /the-leftovers/ would require prefixing every internal
 * link and asset URL.
 */
export const SITE = 'https://theleftoverspb.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  // 'file' emits /about.html rather than /about/index.html, which matches
  // trailingSlash: 'never' exactly — canonical URLs and the served paths are
  // then the same string, with no redirect hop for a crawler to follow.
  build: { format: 'file' },
  integrations: [sitemap(), react()],
  vite: { plugins: [tailwindcss()] },
  image: {
    // Brand motifs are SVG; only photography goes through the image service.
    responsiveStyles: true,
  },
  fonts: [
    {
      // Bold headline sans — section headers, big statement lines.
      provider: fontProviders.google(),
      name: 'Anton',
      cssVariable: '--font-headline',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Impact', 'Haettenschweiler', 'sans-serif'],
    },
    {
      // Body & UI text.
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-body',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      // The display face used in the official logo lockup. Self-hosted from
      // src/assets/fonts (NOT public/, which would duplicate the file into the
      // build output), and pre-converted to woff2 by `npm run font` — Astro's
      // local provider serves the file as given, and the supplied .ttf was
      // 31KB against 19KB for the same glyphs in woff2.
      provider: fontProviders.local(),
      name: 'Monster Mash',
      cssVariable: '--font-brush',
      fallbacks: ['Impact', 'fantasy'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/MonsterMashMedium.woff2'],
            weight: 500,
            style: 'normal',
          },
        ],
      },
    },
  ],
});
