# One-time setup: hosting, domain, CMS

This is the setup a developer does once. Day-to-day publishing needs none of
it — see [EDITING.md](EDITING.md).

Current state: **GitHub Pages**, custom domain **theleftoverspb.com**.
Cloudflare Pages is the PRD's recommendation (§4.1) and its config is already
committed; moving there is a ~10 minute job whenever the team wants it. See
[Moving to Cloudflare Pages](#moving-to-cloudflare-pages) for what it buys.

---

## 1. GitHub

The repo has to live on GitHub: Pages CMS authenticates through a GitHub App,
so that's not optional (PRD §4).

Anyone who should be able to edit content needs write access to this repo.
There are no separate CMS accounts to manage — GitHub access *is* CMS access.

---

## 2. GitHub Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

That's the whole setup. `.github/workflows/deploy.yml` does the rest:

- Every push to `main` — including a content save from Pages CMS, which
  commits straight to `main` — builds and deploys.
- Pull requests build but don't publish, so a broken PR is caught without
  touching the live site.
- `workflow_dispatch` lets you re-deploy the current `main` from the Actions
  tab without pushing an empty commit.

The build step is `npm run build` (`astro check && astro build`), so a type
error or a content file that doesn't match its schema fails the build. **A
failed build leaves the live site serving the last good version** — the worst
case is a stale site, never a broken one.

### Two GitHub Pages gotchas the repo already handles

- **`.nojekyll`** — GitHub Pages runs output through Jekyll by default, and
  Jekyll skips any path starting with an underscore. That would silently drop
  Astro's entire `_astro/` directory: all the CSS, JS and fonts. `public/.nojekyll`
  is committed, and the workflow re-creates it as a safety net.
- **`CNAME`** — the custom domain has to be in the published output or GitHub
  unsets it on every deploy. `public/CNAME` is committed and the workflow fails
  loudly if it ever stops landing in `dist/`.

---

## 3. The custom domain

`theleftoverspb.com`, configured in **Settings → Pages → Custom domain**.

Serving from the root — rather than a `github.io/the-leftovers/` project path —
is what keeps this simple: a project path would need a `base` set in Astro and
every internal link and asset URL prefixed with it.

DNS, at the registrar:

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `kyletaylored.github.io` |

Then tick **Enforce HTTPS** once GitHub finishes provisioning the certificate
(it can take up to an hour on a fresh domain).

### If the domain ever changes

One line, in `astro.config.mjs`:

```js
export const SITE = 'https://theleftoverspb.com';
```

Canonical URLs, `sitemap.xml`, `robots.txt` and the Open Graph tags all derive
from it, so nothing else needs touching. Update `public/CNAME` to match.

### After launch

Submit `https://theleftoverspb.com/sitemap-index.xml` in Google Search Console.

---

## 4. Pages CMS

1. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub.
2. Install the Pages CMS GitHub App on this repo.
3. It reads `.pages.yml` from the repo root — no dashboard configuration, no
   admin build to deploy. The config is under version control with everything
   else.

`.pages.yml` mirrors `src/content.config.ts`. **If you change a collection
schema, change both**, or the CMS will happily write files that fail the build.

---

## 5. Analytics (optional)

Nothing is committed, deliberately. The footer tells visitors the site has no
trackers and no cookies, and that's currently true.

If you want numbers, use something cookieless (Cloudflare Web Analytics is free
and needs no consent banner — PRD §4). **Anything that sets a cookie makes the
footer copy a lie**, so change it in `src/data/site.yml` if that day comes.

---

## 6. Third-party accounts

**None are required.** The site is fully functional with zero third-party
accounts, and every integration degrades to something honest rather than
breaking. That's deliberate: the organisation is informal and hasn't picked
long-term tools, so nothing here assumes a commitment.

| Service | What it would add | Without it (current state) |
|---|---|---|
| **Google Forms** | Pre-orders land in a Sheet automatically | The order form still works — it prices and formats the order and the buyer emails or pastes it. See [PREORDERS.md](PREORDERS.md) |
| **Discord** | The free official server widget | Community page shows a link-out card |
| **A mailing-list provider** | An actual list to join | The newsletter block points at the community channels instead of showing a form that posts nowhere |
| **An Instagram widget** | A live photo grid | Community page shows a link-out card; the on-site slideshow covers photos |
| **A print store** (Bonfire etc.) | Evergreen merch | `products` is empty and the shop shows drops only. Batch jersey drops don't need it |

Fill any of them in via **Site settings** in the CMS as and when the team
decides. No code changes needed for any except the Instagram widget, which
needs its script origin allowlisted in `public/_headers`.

## Moving to Cloudflare Pages

The PRD recommends Cloudflare Pages (§4.1) and the config for it is already in
the repo: `wrangler.toml`, `public/_headers` and `public/_redirects`. Those
last two are **Cloudflare features that GitHub Pages ignores entirely**, which
is the real cost of staying where we are:

| | GitHub Pages (today) | Cloudflare Pages |
|---|---|---|
| Security headers + strict CSP (`_headers`) | **Not applied** | Applied |
| Redirects (`_redirects`) | **Not applied** | Applied |
| Per-PR preview deployments | No | Yes, automatic |
| Edge functions, if ever needed | No | Available |
| Cost | Free | Free |

To switch:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and pick this repo.
2. Framework preset **Astro**, build command `npm run build`, output directory
   `dist`, Node 20+.
3. Move the domain's DNS to Cloudflare and add the custom domain in the Pages
   project.
4. Disable the GitHub Pages source (Settings → Pages → Source: None) so two
   hosts aren't fighting over the same domain, and either delete
   `.github/workflows/deploy.yml` or leave it building PRs.

No application code changes. `_headers` and `_redirects` start working on the
first deploy, which is the point.
