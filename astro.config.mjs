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
      /**
       * The display face from the official logo lockup. Licensed for web use
       * (Comic Book Fonts LLC), so the WOFF2 from the vendor's `Web/` folder
       * is what ships — the OTF/TTF in that download are desktop-only.
       *
       * NOT subsetted, and deliberately so: the licence forbids derivative
       * works and reverse-engineering, which is exactly what subsetting or
       * re-encoding the file would be. 47KB is the price of using it legally,
       * which is also why it is not preloaded (see BaseLayout).
       *
       * Licence is per-domain with a monthly pageview allowance — see
       * ATTRIBUTIONS.md before adding a second domain or celebrating traffic.
       */
      provider: fontProviders.local(),
      name: 'CC Monster Mash',
      cssVariable: '--font-brush',
      fallbacks: ['Impact', 'fantasy'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/CCMonsterMash-Regular.woff2'],
            weight: 400,
            style: 'normal',
          },
        ],
      },
    },
  ],
});
