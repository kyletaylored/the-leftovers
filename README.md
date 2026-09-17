# The Leftovers — team website

Static site for **The Leftovers**, a semi-professional, community-run paintball
team with a rotating free-agent roster.

Live at **[theleftoverspb.com](https://theleftoverspb.com)**.

Built against `_reference/the-leftovers-website-PRD.md` and the brand style
guide alongside it. Note that `_reference/` is gitignored, so those files are
local-only — section references below (§4, §8.1, §10.2 and so on) point into
that PRD. If you've cloned this and don't have it, ask the captain for a copy;
the decisions it drives are summarised inline throughout this README and in
the comments at the top of each component.

The short version of the architecture: **there is no backend.** Content is flat
files in this repo edited through a hosted CMS UI, payments happen on Bonfire,
the mailing list posts straight to the email provider, and the whole thing
builds to static HTML on a free Cloudflare Pages plan. Nothing here has a
monthly bill or a database to keep alive.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | [Astro](https://astro.build) 7 — static output, zero JS by default |
| Styling | Tailwind CSS 4 (`@theme` tokens in `src/styles/global.css`) |
| Islands | Svelte 5, used for exactly two components (see below) |
| Content | Astro content collections — Markdown/YAML in `src/content` |
| CMS | [Pages CMS](https://pagescms.org) — config in `.pages.yml` |
| Fonts | Astro's font API, self-hosted and subset (Anton, Inter, Permanent Marker) |
| Hosting | **GitHub Pages** today (`.github/workflows/deploy.yml`); Cloudflare Pages config is committed and ready |

### Why only two islands

Astro ships no JavaScript unless a component asks for it, so the framework
choice only matters for the handful of things that genuinely need state:

- **`Countdown.svelte`** — ticks down to the next event. Server-rendered with
  correct values first, so it is never blank and never shifts layout.
- **`StatLeaderboardTable.svelte`** — sortable/filterable career stats. Also
  server-rendered as a complete `<table>`: with JS blocked it is still a
  perfectly usable stats table, and sorting is the enhancement.

Everything else is plain Astro or CSS. The mobile nav is ~30 lines of vanilla
JS, the FAQ accordion is native `<details>`, and the sponsor marquee is a CSS
animation. Total JS shipped: **~47 KB uncompressed / ~17 KB gzipped**, almost
all of it the Svelte runtime.

---

## Quickstart

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check && astro build -> dist/
npm run preview    # serve dist/ locally
npm run og         # regenerate public/og-default.png after brand changes
```

Node 20+ (developed on 26).

---

## Layout

```
src/
  content.config.ts        Collection schemas — the contract .pages.yml fills
  content/                 The actual content, one file per player/event/etc.
  data/site.yml            Site settings: nav, socials, mailing list, shop URLs
  lib/
    settings.ts            Parses site.yml through Zod at build time
    stats.ts               Derives every stat from the results collection
    events.ts              Derives upcoming/past from dates
    format.ts              Dates, money, rates — all UTC (see below)
    images.ts              Maps a CMS image path to an optimizable asset
  components/
    brand/                 Wordmark, Mascot, TerracedDivider, RuyiCloud,
                           Lantern, Badge, Icon — the reusable brand assets
    *.astro                The component library (PRD §7)
    *.svelte               The two islands
  layouts/BaseLayout.astro The single HTML shell
  pages/                   One file per route
  styles/global.css        Brand tokens + the ribbed-numeral treatment
scripts/make-og-default.mjs  Generates the social card
```

### Decisions worth knowing before you change something

- **Nothing derivable is editable.** Win rates, records, upcoming-vs-past, and
  per-player totals are all computed in `src/lib` from raw counts. The CMS only
  ever collects things a human observed. This is the main defence against a
  stats page that quietly contradicts itself (PRD §13).
- **Dates are formatted in UTC, deliberately.** The CMS collects date-only
  values (`2026-09-19`), which parse to UTC midnight. Formatting those in a
  local zone renders the previous day anywhere west of Greenwich — including on
  the build machine. See the comment in `src/lib/format.ts`.
- **Every image field has a required `alt` field** next to it, enforced in both
  the schema and `.pages.yml`. It's an accessibility requirement and an SEO
  input, and it is not left to whoever's typing fastest after a tournament.
- **Media live in `src/assets/img`, not `public/`.** That's what lets Astro's
  `<Image>` emit responsive `srcset` and modern formats. `src/lib/images.ts`
  maps the CMS's path string back to the build-time asset.
- **The gold ribbed numerals are a CSS treatment, not a font** — a gradient
  plus repeating ribs clipped to the text (`.numeral` in `global.css`), with a
  flat-gold fallback for browsers without `background-clip: text` and for
  forced-colors mode.
- **The wordmark is pinned with `textLength`.** It renders at identical metrics
  whether the brush face loaded, is loading, or failed — no reflow, no CLS.
  When licensed logo art arrives, replace the two `<text>` nodes in
  `Wordmark.astro` with `<path>` data and nothing else changes.

---

## Content & deployment

- Editing content (for the team, no code required): **[docs/EDITING.md](docs/EDITING.md)**
- First-time CMS + hosting setup: **[docs/DEPLOY.md](docs/DEPLOY.md)**

Day to day: a save in Pages CMS is a commit to `main`, which triggers
`.github/workflows/deploy.yml` and is live in a couple of minutes. There is no
manual deploy step.

The workflow runs `npm run build`, which is `astro check && astro build` — a
type error or a content file that doesn't match its schema fails the build
rather than deploying a broken page, and a failed build leaves the live site
serving the last good version.

---

## Measured results

Lighthouse, **mobile** preset, against `npm run preview` (PRD §10.2 target was
≥ 90 on all four):

| Page | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 1.7 s | 0 | 0 ms |
| `/roster` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |
| `/stats` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |
| `/events` | 100 | 100 | 100 | 100 | 1.7 s | 0 | 0 ms |
| `/shop` | 100 | 100 | 100 | 100 | 1.7 s | 0 | 0 ms |
| `/community` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |
| `/contact` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |
| `/about` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |

Re-run any of these with:

```bash
npm run build && npm run preview &
npx lighthouse http://localhost:4321/roster --chrome-flags="--headless"
```

### Contrast (WCAG AA)

The brand's dark base with crimson and gold accents needed real checking, not
assuming (PRD §10.4). Measured:

| Pair | Ratio | AA body text |
|---|---|---|
| `bone` on `ink` | 17.5 | pass |
| `bone-muted` on `ink-800` | 8.8 | pass |
| `gold-300` on `ink` | 11.3 | pass |
| `bone` on `crimson` (button) | 8.0 | pass |
| `ink` on `gold` (button) | 8.2 | pass |
| **locked `crimson` as text on `ink`** | **2.2** | **fail** |

That last row is the reason the palette has both `crimson` and `crimson-400`:
the locked brand crimson is a **fill** colour (buttons, banners, the wordmark)
and `crimson-400` is its **text** variant. The wordmark itself uses the locked
crimson and is exempt — WCAG excludes logotypes — but no body copy or button
label does.

---

## Still open (carried over from PRD §13)

These are decisions for the team, not code gaps:

1. **Security headers are not active yet.** `public/_headers` carries the
   strict CSP and the security headers, but those are a *Cloudflare Pages*
   feature — GitHub Pages ignores the file entirely. They start working the
   day the site moves to Cloudflare Pages (see
   [docs/DEPLOY.md](docs/DEPLOY.md)); there's nothing to change in the repo.
2. **Discord server ID** — set `discordServerId` in `src/data/site.yml` to swap
   the Community page's link-out card for Discord's live widget.
3. **Instagram widget** — pick a provider free tier and fill in
   `instagramWidget`. Until then the page shows a link-out card rather than a
   hole. Allowlist the script's origin in `public/_headers` at the same time,
   so it doesn't break the moment the site moves to Cloudflare Pages.
4. **Mailing list** — `mailingList.formAction` points at a placeholder
   Buttondown endpoint. Swap in the real one.
5. **Who owns content edits** day to day. The tooling is done; the owner isn't
   named.

### Not built (phase 2/3 per PRD §12)

`/news` recap posts, the CSV importer for stat entry, and any Snipcart-style
in-brand checkout. `/news` currently 302s to `/events` via `public/_redirects`
so early links don't 404.
