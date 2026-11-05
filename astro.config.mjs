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
      // Headline face for every h1–h4, numerals and card titles. Gasoek One
      // replaced Anton in Nov 2026 at the team's request (website feedback
      // doc). Self-hosted at build time by Astro's font API, so the CSP's
      // `font-src 'self'` still holds. Open Font Licence: no licence limits.
      provider: fontProviders.google(),
      name: 'Gasoek One',
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
       * The `Worn` cut, which matches the distressed edges of the logo
       * lettering. It costs ~89KB against ~48KB for `Regular` — accepted
       * knowingly for brand fidelity.
       *
       * Note it is NOT preloaded, but do not read that as "cheap": the nav
       * wordmark is above the fold, so the browser discovers this face while
       * building first paint and fetches it at VeryHigh priority regardless.
       * Measured: skipping the preload does not deprioritise it. The ~0.3s of
       * homepage LCP it costs is the honest price, and the only real lever
       * would be to stop rendering the wordmark as live text at all.
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
