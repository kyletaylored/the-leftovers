# PRD conformance audit

Checked section by section against `_reference/the-leftovers-website-PRD.md`
(358 lines, md5 `b0bbf4e3deede168bdb3f9d4c7a27435`). Records what shipped,
what deviates and why, and what is deliberately not built.

Legend: **Done** · **Deviation** (built differently, with reason) ·
**Not built** (out of Phase 1 scope, or blocked on a decision)

---

## §2 Goals

| Goal | Status | Where |
|---|---|---|
| 1. Real home reflecting the brand, not a template | Done | Custom brand components in `src/components/brand/`, no UI kit |
| 2. Non-developer can update roster/events/stats without Git | Done | `.pages.yml` + [EDITING.md](EDITING.md) |
| 3. Funnel to community and shop without an e-commerce stack | Done | `/community`, `/shop` link out; no cart |
| 4. Stats page that feels like stats, not a spreadsheet | Done | `/stats` — derived rates, sortable island, gold leader row |
| 5. Free/near-free infra, no monthly bill | Done | GitHub Pages now, Cloudflare Pages ready. $0 |
| 6. Mobile-first, performance, SEO as shaping constraints | Done | Measured: 100/100/100/100 mobile, all 8 pages |

### Non-goals — all honoured
No PBLeague sync, no self-hosted payments, no accounts, no CMS-driven
inventory. Nothing in the repo does any of these.

## §4 Tech stack

Astro · Tailwind + CSS custom properties · framework-light islands with Svelte
only where state is real · Pages CMS · GitHub · CI on push · native form to
the email provider — **all as specified**.

**Deviation — hosting.** The PRD recommends Cloudflare Pages (§4.1) and this
ships on **GitHub Pages**, its documented fallback, at the team's request.
The Cloudflare config (`wrangler.toml`, `_headers`, `_redirects`) is committed
and unused. The real cost is that **the strict CSP and security headers in
`public/_headers` are not active**, since that's a Cloudflare feature. Switch
path in [DEPLOY.md](DEPLOY.md).

**Deviation — analytics.** Cloudflare Web Analytics is a Cloudflare-only
feature, so nothing is wired up. No tracking script is committed, which keeps
the footer's "no trackers, no cookies" claim true.

### The islands decision, as built

Svelte is in the stack for exactly two components, which is what §4 asks for:

| Interactive thing | How it's built | JS cost |
|---|---|---|
| Sortable/filterable stat table | Svelte island, SSR'd as a full `<table>` first | ~4.8 KB + runtime |
| Event countdown | Svelte island, SSR'd with correct values | ~1.4 KB + runtime |
| Mobile nav toggle | ~30 lines of vanilla JS | negligible |
| FAQ accordion | Native `<details>` | **0** |
| Sponsor marquee | CSS animation | **0** |
| Hero video variant | Declarative `<video autoplay muted>` | **0** |

Total: ~47 KB raw / ~17 KB gzipped, nearly all the Svelte runtime.

## §5 Site map

`/` `/about` `/roster` `/stats` `/events` `/shop` `/community` `/contact` —
**all done**, plus a 404.

`/news` is marked *(phase 2, optional)* in the PRD and is **not built**.
`public/_redirects` 302s `/news` → `/events` so early links don't 404 (inert
on GitHub Pages — see §4 deviation).

## §6 Content model

All seven collections exist with the specified fields: `players`, `events`,
`results`, `sponsors`, `products`, `pages`, `site-settings`. Schemas in
`src/content.config.ts`, CMS forms in `.pages.yml`.

**The required-alt rule is enforced in both places** — `photoAlt`, `coverAlt`,
`imageAlt` and `logoAlt` sit next to every image field and are marked
`required` in `.pages.yml`.

Two deliberate departures, both in the same direction — *keep derivable values
out of the CMS so they can't go stale or contradict each other*:

1. **`events.status`** is specified as an editable `upcoming | past` field. It
   is present but **optional, and treated as an override**. Upcoming/past is
   derived from the date (`src/lib/events.ts`), so nobody has to remember to
   flip a flag the Monday after a tournament. §13 names content upkeep as the
   project's main risk; this removes one chore from it.
2. **`results`** collects raw counts only. Every rate, total and standing on
   `/stats` and the homepage is computed in `src/lib/stats.ts`. A hand-typed
   win rate would eventually disagree with the counts it came from.

**Addition:** a `faqs` collection, not in §6. It feeds the About page
accordion and the `FAQPage` structured data in §10.3.

## §7 Component library

All 12 traditional and all 6 custom components exist.

| Component | Status |
|---|---|
| Hero — image / video bg / text-only | Done (4 variants incl. `brand` for the mockup hero) |
| Two-column, Three-column, CTA strip, Callout | Done |
| Profile/bio card, Gallery/masonry, Sponsor marquee | Done |
| Countdown, FAQ accordion, Newsletter, Social embed | Done |
| PlayerCard (incl. dashed OPEN SLOT variant w/ mascot) | Done |
| EventCard (date badge, tag, CTA, terraced footer) | Done |
| StatLeaderboardTable (sortable, gold top row) | Done |
| TerracedDivider, MascotCallout, SponsorMarquee | Done |

**Gap worth naming: three of these aren't placed on a page yet** —
`TwoColumn`, `ProfileCard` and `Gallery`. They're complete and typed, but
they're library stock until something uses them, and each is waiting on
content that doesn't exist: `Gallery` needs event photos, `ProfileCard` needs
a captain/coach bio, `TwoColumn` needs an image for the About page. Dropping
them onto a page with placeholder content would have looked like progress and
produced worse pages.

Likewise the **Hero `video` variant** is implemented and render-tested but no
page uses it — there's no footage in the repo.

## §8 Feature specs

**§8.1 Stats.** Built as v1 structured manual entry, exactly as specified.
`/stats` renders whatever is in `results`; the page says plainly where the
numbers come from and why there's no sync. Phase 2 CSV import and phase 3
PBLI outreach **not built** (correctly — they're later phases).

**§8.2 Shop.** Bonfire recommendation followed. `products` renders teaser
cards that link out; **zero payment or PCI surface** on our infra. Pre-order
batch mechanic is first-class: `preorderCloses` drives a countdown, and
`sold-out` keeps a closed batch visible without taking orders.

**§8.3 Social.** Each channel built to its actual constraint:

| Channel | Built as |
|---|---|
| Facebook group | Link-out only. Groups cannot be embedded by anyone — the component says so in a comment so nobody re-litigates it |
| Instagram | Third-party widget slot, configured from site settings. Unconfigured, it renders a link-out card, not an empty hole |
| Discord | Official free widget, needs only a server ID; falls back to a link-out card |
| Mailing list | Native `<form>` posting straight to the provider. No PII touches our infra |

## §9 Design system

Colour tokens (near-black, crimson, gold, forest, tan) as CSS custom
properties exposed to Tailwind via `@theme`. All four type roles: wordmark
(Permanent Marker, subset to the glyphs in "THE LEFTOVERS"), headline sans
(Anton), gold ribbed numerals **as a CSS treatment rather than a typeface**,
body (Inter). `font-display: swap` throughout.

Motifs — `TerracedDivider`, ruyi clouds, lanterns, takeout-box mascot — are
reusable SVG components, so the OPEN SLOT card, the 404 and the newsletter
block share one mascot.

**Deviation:** §9 says treat the wordmark as a static SVG asset rather than
live text. It's a single self-contained SVG component, but the glyphs are
`<text>` pinned with `textLength`/`lengthAdjust` inside a fixed viewBox —
which delivers what the requirement was *for* (identical metrics whether the
brush face loaded, is loading, or failed; no layout shift) without hand-
tracing paths for art that isn't licensed yet. Swapping in real logo art
means replacing two nodes in `Wordmark.astro`.

## §10 Non-functional

**§10.1 Mobile-first.** Single-column base everywhere, columns added upward at
`sm`/`md`/`lg` and never removed. Hamburger nav behind a lightweight island
with the primary CTA kept *outside* it. 44×44px minimum targets. Flat motifs
are SVG; photography goes through `<Image>` with responsive `srcset` and
lazy-loading below the fold. Tested on the throttled Lighthouse mobile
preset, not desktop.

**§10.2 Performance.** Target was ≥90 mobile on all four categories.
**Measured 100/100/100/100 on all eight pages**; LCP 1.5–1.7s (budget 2.5s),
CLS 0 (budget 0.1), TBT 0ms. Fonts self-hosted, subset, `swap`, preloaded.

**§10.3 SEO.** `@astrojs/sitemap`, generated `robots.txt`, canonical URLs,
per-page title/description/OG/Twitter from the `pages` collection's SEO
fields. JSON-LD: `SportsTeam` sitewide, `Person` nested under the team on
`/roster`, `SportsEvent` per tournament, `Product` with price/availability,
`FAQPage` on `/about`. One `<h1>` per page — `PageHeader` owns it and no card
component can introduce a competing one. Roster ↔ stats ↔ events cross-link.

**§10.4 Accessibility.** WCAG AA contrast measured, not assumed — full table
in the [README](../README.md#contrast-wcag-aa). The finding that shaped the
palette: the locked crimson scores **2.18** as text on the near-black base, so
`crimson` is a fill and `crimson-400` is the text variant. Semantic HTML and
keyboard operation for all three interactive things; the stat table sorts via
real `<th>` buttons with `aria-sort`.

## §11 Editorial workflow

As specified: GitHub access is CMS access, day-to-day edits happen entirely in
the Pages CMS UI, every save is a commit to `main` that rebuilds and deploys,
and structural changes go through normal review. Written up for the
non-developer in [EDITING.md](EDITING.md).

One safety property worth stating: `npm run build` is `astro check && astro
build`, so a content file that doesn't match its schema **fails the build
rather than deploying**. The worst case of a bad CMS save is a stale site,
never a broken one.

## §12 Phased rollout

**Phase 1 — complete**, including the launch requirements §12 is explicit
about not deferring (mobile-first layout, CWV budget, sitemap, robots,
per-page SEO metadata and structured data).

**Ahead of schedule:** `/stats` with the manual entry workflow is listed as
Phase 2 and is fully built — the content model made it nearly free.

**Not built (correctly):** `/news` recap posts, CSV import tooling, Snipcart
evaluation, PBLI data partnership.

## §13 Risks & open questions

| Item | State |
|---|---|
| Stats entry is manual labour, needs an owner | Unchanged — a people problem. Tooling minimises it: counts only, everything else derived |
| Facebook group can't be embedded | Handled and documented in three places so no one designs around a group feed |
| Free-tier caps to monitor | Unchanged — nothing to build |
| **Domain & DNS** | **Resolved** — theleftoverspb.com, live in `astro.config.mjs` and `public/CNAME` |
| Who owns content edits day to day | **Still open.** Tooling is done; the person isn't named |

### Open items added by implementation

1. Security headers inactive until the Cloudflare move (§4 deviation above).
2. `discordServerId` empty → Community shows a link-out card.
3. Instagram widget unconfigured → link-out card. Allowlist its script origin
   in `public/_headers` when adding it.
4. `mailingList.formAction` is a placeholder Buttondown endpoint.
5. `.pages.yml` uses `pattern: {regex: …}` for URL field validation, which I
   could not confirm against the Pages CMS docs (their fields page 404s).
   If the CMS rejects the config, that's the first thing to remove — Zod
   already enforces the same rules at build time.

---

## style-2 UI sheet deltas

The PRD is the contract, and where it and the mockups disagree the PRD wins.
But `docs/design/ui-components.webp` is more prescriptive at component level
than §7's prose, and comparing the two turns up the following. None of it is
broken; all of it is a fidelity choice someone should make on purpose.

### Sheet specifies, not built

| # | Sheet | Built | Notes |
|---|---|---|---|
| 1 | **Sold-out badge is crimson filled** | Grey (`ink-700` + muted text) | One-line fix. Grey reads as "inactive", crimson as "gone" — the sheet's call is probably better |
| 2 | **Leading stat row is SOLID gold with dark text** | 12% gold tint + inset gold bar | §7 only says "gold highlight on top row", so mine satisfies the PRD but undersells the sheet. Solid gold needs the row's text switched to `ink` to hold contrast |
| 3 | **Tertiary / text-link button** (gold, underlined) | Not built | No consumer yet |
| 4 | **Disabled button state** (grey) | Not built | No consumer yet — nothing on the site disables a button |
| 5 | **Event date badge includes day-of-week** ("SAT" above "SEP 20") | Month + day only | `dayOfWeek()` already exists in `lib/format.ts`, unused |
| 6 | **Ruyi clouds in event/player card corners** | Cards have no clouds | Clouds are currently section-level only (hero, CTA strips) |
| 7 | **Toast / feedback notification** ("Thanks for joining the crew!") | Not built | Not in §7 either. Would need a reason to exist — the newsletter form posts to the provider and leaves the page, so there's nothing to confirm in-page |
| 8 | **Visible labels above form fields** | `sr-only` label + placeholder | Mine is accessible (a real `<label>` is always present) but visually differs. A visible label is the better pattern; placeholders disappear on focus |

### Where the sheet and the PRD actively conflict

**PlayerCard.** §7 specifies "big ghost-type jersey number **behind** photo,
gold ribbed-numeral treatment, name bar, role tag" — which is what's built.
The sheet instead shows the numeral **beside** the photo in a gold frame, with
the name in a crimson banner and the role in a pill, plus corner clouds.

I followed the PRD text. Worth a decision, because the sheet's version is the
more distinctive card.

### Homepage layout

`homepage-mockup-a` is what's built. `homepage-mockup-b` adds a full-bleed
action photo with the *"Paintball builds better people"* manifesto line and
inline stats, plus a crimson full-width next-up band. Both are photography
problems, not code problems — and the manifesto band is the obvious home for
the `TwoColumn` component that currently ships unused (§7 gap above).

### Honest note on sequencing

The brand guide and `homepage-1` drove the build. I did not review
`style-2`/`homepage-3` in detail until after implementation, when they were
added to the README — which is why these deltas surfaced late rather than
being decided up front. Nothing here contradicts the PRD; it's fidelity
against a sheet that is more specific than the spec it accompanies.
