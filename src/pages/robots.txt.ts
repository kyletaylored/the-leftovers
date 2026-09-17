import type { APIRoute } from 'astro';

/**
 * robots.txt (§10.3). Generated rather than static so the sitemap URL can't
 * drift from the configured `site` when the domain decision lands (§13).
 */
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
