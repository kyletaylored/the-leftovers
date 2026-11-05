// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * sitemap-noindex — keeps the sitemap honest: a page that tells crawlers
 * `noindex` is never listed in sitemap-*.xml.
 *
 * Why an integration instead of @astrojs/sitemap's `filter` option: `filter`
 * runs in astro.config.mjs, before any content is loaded, so it can only see
 * a hand-maintained list of paths. That list used to live in the config and
 * drift from the pages it described. This reads the BUILT HTML instead, so
 * the robots meta tag (from a page's `noindex` prop, or the CMS's "Hide from
 * search engines" box via `seo.noindex`) is the single source of truth.
 * Redirect stubs, /design, the 404 page and hidden pages all drop out for
 * the same reason, with nothing to keep in sync.
 *
 * Must be listed AFTER sitemap() in `integrations`: Astro runs each
 * integration's `astro:build:done` in order, and this edits sitemap()'s
 * output.
 *
 * A Google Search Console "Submitted URL marked noindex" warning is exactly
 * what this prevents.
 */
/** @returns {import('astro').AstroIntegration} */
export default function sitemapNoindex() {
  /** @type {URL | undefined} */
  let site;
  return {
    name: 'sitemap-noindex',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site ? new URL(config.site) : undefined;
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (!site) return;
        const root = fileURLToPath(dir);

        // Every built page that says noindex, as its canonical URL.
        const hidden = new Set();
        for (const file of await htmlFiles(root)) {
          const html = await fs.readFile(file, 'utf8');
          if (!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) continue;
          const rel = path.relative(root, file).split(path.sep).join('/');
          const route = '/' + rel.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
          hidden.add(new URL(route, site).href.replace(/(.+)\/$/, '$1'));
        }

        const sitemaps = (await fs.readdir(root)).filter((f) => /^sitemap-\d+\.xml$/.test(f));
        let removed = 0;
        for (const name of sitemaps) {
          const file = path.join(root, name);
          const xml = await fs.readFile(file, 'utf8');
          const next = xml.replace(/<url>[\s\S]*?<\/url>/g, (entry) => {
            const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1]?.replace(/(.+)\/$/, '$1');
            if (loc && hidden.has(loc)) {
              removed += 1;
              return '';
            }
            return entry;
          });
          if (next !== xml) await fs.writeFile(file, next);
        }
        logger.info(`${hidden.size} noindex page(s); removed ${removed} from the sitemap`);
      },
    },
  };
}

/** @param {string} dir @returns {Promise<string[]>} */
async function htmlFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '_astro') out.push(...(await htmlFiles(full)));
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}
