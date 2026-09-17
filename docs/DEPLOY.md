# One-time setup: CMS, hosting, domain

This is the setup a developer does once. Day-to-day publishing needs none of
it — see [EDITING.md](EDITING.md).

---

## 1. GitHub

The repo has to live on GitHub: Pages CMS authenticates through a GitHub App,
so that's not optional (PRD §4).

```bash
gh repo create the-leftovers --private --source=. --push
```

Anyone who should be able to edit content needs write access to this repo.
There are no separate CMS accounts to manage — GitHub access *is* CMS access.

---

## 2. Cloudflare Pages

Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 or newer (`NODE_VERSION` env var if the default is older) |

Every push to `main` deploys. Every pull request gets its own preview URL,
which is one of the reasons the PRD picked Pages over GitHub Pages (§4.1) — the
other being custom headers, which this repo uses.

`wrangler.toml` is committed so `npx wrangler pages deploy` and the dashboard
agree on the output directory.

### What the committed config does

- **`public/_headers`** — security headers plus a strict Content Security
  Policy, and immutable caching for hashed assets and fonts.
  **If you add a third-party widget script (§8.3), you must allowlist its
  origin here** or the browser will silently block it.
- **`public/_redirects`** — 301s the slashed URL variants to the canonical
  unslashed ones, and 302s `/news` to `/events` until the phase-2 news section
  exists.

---

## 3. Point the site at the real domain

One line, in `astro.config.mjs`:

```js
export const SITE = 'https://theleftovers.example';
```

Canonical URLs, `sitemap.xml`, `robots.txt` and the Open Graph tags all read
from it, so nothing else needs touching. Until the domain decision lands
(PRD §13) it's the `*.pages.dev` placeholder.

Then in Cloudflare Pages → your project → **Custom domains**, add the domain
and follow the DNS instructions.

Afterwards: submit `https://yourdomain/sitemap-index.xml` in Google Search
Console.

---

## 4. Pages CMS

1. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub.
2. Install the Pages CMS GitHub App on this repo.
3. It reads `.pages.yml` from the repo root — no configuration in a dashboard,
   no admin build to deploy. The config is under version control with
   everything else.

`.pages.yml` mirrors `src/content.config.ts`. **If you change a collection
schema, change both**, or the CMS will happily write files that fail the build.
The build failing is the safe outcome here — a failed build leaves the live
site untouched — but it's still a bad afternoon for whoever hits it.

---

## 5. Analytics (optional)

Cloudflare Web Analytics is free, cookieless and needs no consent banner
(PRD §4). Enable it in the Cloudflare dashboard under **Web Analytics** and
point it at the site — it's a dashboard toggle, not a code change, so no
tracking script is committed here.

The footer currently tells visitors the site has no trackers and no cookies.
Cookieless analytics keeps that true; **anything that sets a cookie makes the
footer a lie**, so change the copy in `src/data/site.yml` if that ever changes.

---

## 6. Third-party accounts

None of these are required to launch, and the site degrades honestly without
each of them:

| Service | What it's for | Without it |
|---|---|---|
| **Bonfire** | Jersey pre-order batches and merch (PRD §8.2) | Shop cards link to a placeholder store URL |
| **Buttondown** (or Mailchimp) | Mailing list | The signup form posts nowhere useful |
| **Discord** | Community hub + free official widget | Community page shows a link-out card |
| **Elfsight / Juicer / SnapWidget** | Instagram feed grid | Community page shows a link-out card |

Fill each one in via **Site settings** in the CMS as the accounts come online.
No code change needed for any of them except allowlisting the Instagram
widget's script origin in `public/_headers`.
