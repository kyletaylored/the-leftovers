/**
 * Shared markup for the tiny /about, /roster, /stats redirect stubs (Oct
 * 2026 page merge — see src/pages/team.astro).
 *
 * These deliberately do NOT use BaseLayout: no nav/footer chrome to flash
 * before a redirect that should be instant, and no reason to load the full
 * font set for a page nobody is meant to read. A meta-refresh is what
 * actually works here — GitHub Pages (the current host) ignores
 * `public/_redirects` entirely, that's a Cloudflare-only feature (see
 * docs/DEPLOY.md) — paired with `noindex` and a canonical pointing at the
 * real destination so search engines re-point rather than keeping two
 * competing URLs indexed.
 */
export function redirectHtml(to: string, label: string, siteUrl: string) {
  // Canonical points at the base page, not the fragment — a fragment isn't
  // a distinct crawlable resource, so a canonical with one is a mild lie.
  // The meta-refresh below still jumps to the fragment for the visitor.
  const canonical = new URL(to.split('#')[0], siteUrl).href;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, follow" />
<link rel="canonical" href="${canonical}" />
<meta http-equiv="refresh" content="0; url=${to}" />
<title>Redirecting to ${label} — The Leftovers</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:#0b0a08; color:#b9b2a4; font:15px/1.6 system-ui,sans-serif; text-align:center; padding:24px; }
  a { color:#e0c164; text-decoration:underline; text-underline-offset:3px; }
  strong { color:#f4f1ea; }
</style>
</head>
<body>
  <div>
    <p>This page moved. Redirecting to <strong>${label}</strong>…</p>
    <p><a href="${to}">Continue to ${label}</a></p>
  </div>
</body>
</html>`;
}
