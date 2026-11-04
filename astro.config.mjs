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

/**
 * Pages the team has hidden for now (website feedback, Nov 2026). They still
 * build, but they are `noindex`, out of the sitemap, out of the nav and
 * footer, and nothing visible links to them. To bring one back: remove it
 * here, remove its `noindex` from the page's <BaseLayout>, and add it to
 * `nav` in src/data/site.yml.
 */
const HIDDEN_PAGES = ['/team', '/events', '/shop', '/community'];

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  // 'file' emits /about.html rather than /about/index.html, which matches
  // trailingSlash: 'never' exactly — canonical URLs and the served paths are
  // then the same string, with no redirect hop for a crawler to follow.
  build: { format: 'file' },
  integrations: [
    sitemap({
      // /about, /roster, /stats are thin meta-refresh stubs now (folded into
      // /team — see src/pages/team.astro). They 200, so the sitemap
      // generator would otherwise list them as if they were real pages.
      // /design is the internal design-system storybook (noindex) — a tool
      // for whoever's building the site, not a page for visitors.
      filter: (page) =>
        !['/about', '/roster', '/stats', '/design', ...HIDDEN_PAGES].some((p) => page.endsWith(p)) &&
        // /preview/* are design review pages (noindex), never linked.
        !page.includes('/preview/'),
    }),
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
