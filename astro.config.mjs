// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import sitemapNoindex from './integrations/sitemap-noindex.mjs';
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

/** Unicode ranges for the Gasoek One files, as @fontsource publishes them. */
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  // 'file' emits /about.html rather than /about/index.html, which matches
  // trailingSlash: 'never' exactly — canonical URLs and the served paths are
  // then the same string, with no redirect hop for a crawler to follow.
  build: { format: 'file' },
  integrations: [
    // No `filter` list here on purpose. Which pages stay out of the sitemap
    // is decided by each page's robots meta tag: sitemapNoindex() (next)
    // removes every page that says noindex. That covers the redirect stubs
    // (/about, /roster, /stats), /design, the 404 page, and any page the
    // team hides with the CMS's "Hide from search engines" box (seo.noindex).
    // Hidden pages (Team, Events, Shop, Community, Nov 2026) are hidden that
    // way, in their content files.
    sitemap(),
    sitemapNoindex(),
    react(),
  ],
  vite: { plugins: [tailwindcss()] },
  image: {
    // Brand motifs are SVG; only photography goes through the image service.
    responsiveStyles: true,
  },
  fonts: [
    {
      /**
       * Headline face for every h1–h4, numerals and card titles. Gasoek One
       * replaced Anton in Nov 2026 at the team's request (website feedback
       * doc). Open Font Licence: no licence limits.
       *
       * Local files from @fontsource, NOT fontProviders.google(). Gasoek is a
       * Korean face: Google serves it as ~90 numbered unicode-range slices,
       * `subsets: ['latin']` can't filter those, and `<Font preload>` then
       * preloaded every one. That was 500KB ahead of the hero logo and most
       * of a 5s mobile LCP. The site only sets Latin text in this face (the
       * 田 in the terraces is drawn as SVG), so Hangul isn't shipped at all.
       */
      provider: fontProviders.local(),
      name: 'Gasoek One',
      cssVariable: '--font-headline',
      fallbacks: ['Impact', 'Haettenschweiler', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./node_modules/@fontsource/gasoek-one/files/gasoek-one-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            unicodeRange: [LATIN],
          },
          {
            // Accented names. Only downloaded if a page uses one of these.
            src: ['./node_modules/@fontsource/gasoek-one/files/gasoek-one-latin-ext-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            unicodeRange: [LATIN_EXT],
          },
        ],
      },
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
       * The `Worn` cut, which matches the distressed edges of the logo
       * lettering. It costs ~89KB against ~48KB for `Regular` — accepted
       * knowingly for brand fidelity.
       *
       * Not preloaded (nothing is; see BaseLayout). The nav wordmark is above
       * the fold, so the browser still fetches this face early, but it now
       * lands after the hero logo rather than ahead of it, and the wordmark
       * swaps in when it arrives.
       *
       * NOT subsetted, and deliberately so: the licence forbids derivative
       * works and reverse-engineering, which is exactly what subsetting or
       * re-encoding the file would be. The full weight is the price of using
       * it legally.
       *
       * Licence is per-domain with a monthly pageview allowance — see
       * ATTRIBUTIONS.md before adding a second domain or celebrating traffic.
       */
      provider: fontProviders.local(),
      name: 'CC Monster Mash Worn',
      cssVariable: '--font-brush',
      fallbacks: ['Impact', 'fantasy'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/CCMonsterMash-Worn.woff2'],
            weight: 400,
            style: 'normal',
          },
        ],
      },
    },
  ],
});
