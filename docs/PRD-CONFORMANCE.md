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

**Deviation — UI framework.** §4 specifies Svelte for islands and says to
avoid React "unless a specific feature later demands it". The team chose
**React 19 + shadcn/ui** for tooling and maintainability (shadcn registry
access). Measured cost: the client runtime goes from 15 KB gzipped to 66 KB,
and total JS from 17 KB to 90 KB. Every island is `client:visible`, so
nothing loads until scrolled to and the mobile scores held at 100 — LCP
improved to 1.5s because the homepage countdown stopped loading eagerly. The
tradeoff would start to bite if an island ever moves above the fold.

shadcn ships no second palette: its tokens are redefined in terms of brand
tokens in `global.css`, so registry components land on-brand.

**Deviation — analytics.** Cloudflare Web Analytics is a Cloudflare-only
feature, so nothing is wired up. No tracking script is committed, which keeps
the footer's "no trackers, no cookies" claim true.

### The islands decision, as built

Svelte is in the stack for exactly two components, which is what §4 asks for:

| Interactive thing | How it's built | JS cost |
|---|---|---|
| Sortable/filterable stat table | React island, SSR'd as a full `<table>` first | ~5 KB + runtime |
| Event countdown | React island, SSR'd via an Astro wrapper that pins the first value | ~1.3 KB + runtime |
| Photo slideshow | React island on shadcn/ui Carousel (Embla) | ~24 KB + runtime |
| Mobile nav toggle | ~30 lines of vanilla JS | negligible |
| FAQ accordion | Native `<details>` | **0** |
| Sponsor marquee | CSS animation | **0** |
| Hero video variant | Declarative `<video autoplay muted>` | **0** |

Total: ~280 KB raw / ~90 KB gzipped, nearly all the React runtime. All three
are `client:visible`.

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

### Sheet specifies, not built (status as of the Sept 2026 design-handoff pass — see below)

| # | Sheet | Built | Notes |
|---|---|---|---|
| 1 | **Sold-out badge is crimson filled** | **Now matches** — crimson fill, bone text | Grey read as "inactive"; crimson reads as "gone" |
| 2 | **Leading stat row is SOLID gold with dark text** | **Now matches** — solid gold, ink text | Done while porting the table to React. The ribbed gold numeral would vanish on a gold row, so the leader's jersey number renders as flat ink digits |
| 3 | **Tertiary / text-link button** (gold, underlined) | **Built** — `Button` `variant="tertiary"` | Shipped in the design-handoff pass. Still no page uses it yet |
| 4 | **Disabled button state** (grey) | **Built** — `Button` `disabled` prop | Real `disabled` attribute on `<button>`; `aria-disabled` + `tabindex="-1"` on `<a>`, since anchors have no native disabled state |
| 5 | **Event date badge includes day-of-week** ("SAT" above "SEP 20") | **Built** — `EventCard` | `dayOfWeek()` already existed in `lib/format.ts`, just unused until now |
| 6 | **Ruyi clouds in event/player card corners** | **Built on `PlayerCard`** | Deterministic variant/flip derived from the player's own data (number/name), so no call site needs a new prop. `EventCard` still has none — the handoff's before/after didn't show one there |
| 7 | **Toast / feedback notification** ("Thanks for joining the crew!") | Not built | Still no consumer with a reason to trigger one — the newsletter form posts to the provider and leaves the page. Held for the same reason as before, not overlooked |
| 8 | **Visible labels above form fields** | **Now matches everywhere** | `PreorderForm` already used real labels. The one remaining `sr-only` instance (`NewsletterBlock`'s email field) is fixed in the design-handoff pass |

### Where the sheet and the PRD actively conflict — now resolved

**PlayerCard.** §7 specified "big ghost-type jersey number **behind** photo,
gold ribbed-numeral treatment, name bar, role tag"; the sheet showed the
numeral **beside** the photo in a gold frame, with the name in a crimson
banner and the role in a pill, plus corner clouds. Previously built to the
PRD text. **The Sept 2026 design-handoff explicitly resolves this as a
deliberate decision** — "going with the sheet's version as the new canonical
card" — and `PlayerCard.astro` now matches it: photo/numeral-panel side by
side, crimson name-plate, pill role badge, low-opacity corner cloud.

### Homepage layout

`homepage-mockup-a` is what's built. `homepage-mockup-b` adds a full-bleed
action photo with the *"Paintball builds better people"* manifesto line and
inline stats, plus a crimson full-width next-up band. Both are photography
problems, not code problems — and the manifesto band is the obvious home for
the `TwoColumn` component that currently ships unused (§7 gap above).

---

## Design-handoff audit (Sept 2026)

A second design pass landed as
`_reference/design_handoff_leftovers_audit/` — a Storybook plus rebuilt
mockups for all 7 top-level pages, explicitly "condensed from
docs/PRD-CONFORMANCE.md" (its own words). It resolves most of the style-2
deltas above (updated in the table) and adds new material the PRD never
speced. Published as Artifacts for the team to browse — see the links at the
end of this section — since these are reference HTML, not production code
(the bundle's own README says so explicitly: "do not copy the HTML/inline-
styles directly into the repo").

### What shipped from this pass

- **`TerracedDivider`** redrawn. The original was a sharp procedural zigzag —
  a mountain *skyline*, not a mountain *terrace*. Now a `style` prop with
  three redraws (`rice-terrace` default, `pagoda`, `refined-peaks`); the
  ruyi clouds needed no change (already licensed vector art, already fine).
- **6 new icons** — `cart`, `leaderboard`, `sponsor`, `camera`, `check`,
  `sold-out` — added to `Icon.astro`, same 24×24/1.8-stroke language as the
  existing 12.
- **`Button`** gained `variant="tertiary"` and a `disabled` prop (deltas #3,
  #4 above).
- **`PlayerCard`** reworked per the resolved PRD/sheet conflict above.
- **`EventCard`** gained the day-of-week line (delta #5).
- **`NewsletterBlock`**'s one remaining `sr-only` label fixed (delta #8).

Verified: `astro check` clean, mobile Lighthouse re-run on home/roster/events
(97–100 perf, 100 a11y, CLS 0 across repeated runs — one 0.147 CLS reading
didn't reproduce across three clean re-runs, consistent with this box's
known Lighthouse noise rather than a real shift).

### Discrepancies found between the handoff's README and its own content

Worth recording because the README is prose *about* the bundle, and prose
drifts from the thing it describes:

- **Terraced trim.** The README's summary says to replace the divider "with
  the smooth pagoda-roofline silhouette." The Storybook itself presents
  **three** options and says "pick one," defaults its own live previews and
  code appendix to **rice-terrace** (Option A), and the actual `EventCard`
  mockup explicitly says "terraced footer updated to Option A." Meanwhile
  the `Home.dc.html` hero mockup's own divider uses the **pagoda** path.
  Read charitably, this isn't a contradiction — it's a per-placement choice
  the system was built to support (`style` is a prop, not a global switch) —
  but the README's one-line summary overstates it as a single global
  decision. Implemented as: `rice-terrace` default everywhere, `pagoda`
  only on the homepage `Hero`, matching what the mockups actually show
  rather than what the prose claims.
- **New icon list.** The README lists "cart, location pin, stat/leaderboard,
  calendar-date, gear/marker, chat, check, chevron, social" as needed
  additions. `pin`, `calendar`, `chat`, `chevron` and all four social icons
  already existed (confirmed against `Icon.astro` before touching it); the
  Storybook's own "12 existing + 6 new" icon grid is the accurate count and
  is what got built.

### New material not yet built — needs a decision, not a guess

None of this shipped in this pass. Each needs either a real photography
answer or a call the team should make, not one I should make for them:

- **Brush-stroke `Button` variant** (`brush-primary`/`brush-outline`) — an
  irregular hand-drawn SVG background behind the label. Exact path data is
  in the bundle's Home hero CTAs; not wired up because making it the
  homepage default is a bigger visual departure than the other button
  additions and deserves a look first, not a silent swap.
- **`Toast.astro`** — static component only, no trigger anywhere on the
  site yet (same reasoning as delta #7 above).
- **`FormField` / `RadioGroup` / `CheckboxGroup`** — speculative: no page
  currently has a form that needs them. The bundle frames these as prep for
  a future contact/roster-enquiry form that doesn't exist yet.
- **5 net-new marketing organisms** (`FeatureRow`, `PricingCard`, 3×
  `Gallery`, `ProductGrid`) and the **full 7-page reassembly**
  (manifesto section, crew slider, "From the Field" teaser, etc.) — the
  large remaining piece. Every image slot in the mockups is a labelled
  striped placeholder; real photography has to land before these can ship
  as actual pages, not mockup HTML with fake content standing in as if real.
- **Worth a business-side look, not just a design one:** the `PricingCard`
  section's example set includes a **"Sponsor a Slot" tier** ($125/event,
  covers one free agent's entry, name on the roster page, socials
  shoutout) — a real monetisation idea shown as a mockup example, not
  sourced from any existing content file. Flagging it here so it doesn't
  get lost as "just an example."

### Reference links (private Artifacts, this account)

- [Design Storybook](https://claude.ai/artifact/U7z7FKdBokERWqJD5XSHoa) — start here
- [Home](https://claude.ai/artifact/AtephDpywCKpW8d977HQN9) · [Roster](https://claude.ai/artifact/BKsYm7F2x879MPa4fWj4tC) · [Events](https://claude.ai/artifact/GYSwah3RSHryUvo4194fE9) · [Shop](https://claude.ai/artifact/5VyMEPBeEBNGuizQaPrCcd) · [About](https://claude.ai/artifact/SCwDP3SZiSN53ghRRUNsXr) · [Contact](https://claude.ai/artifact/HCBM1aWUuW8cedyvgfc5ce) · [Community](https://claude.ai/artifact/DFSYteUw27XmC4aXGeYirY)

The source bundle lives at `_reference/design_handoff_leftovers_audit/`
(gitignored, matching the other `_reference/` material — not committed).

### Honest note on sequencing

The brand guide and `homepage-1` drove the build. I did not review
`style-2`/`homepage-3` in detail until after implementation, when they were
added to the README — which is why these deltas surfaced late rather than
being decided up front. Nothing here contradicts the PRD; it's fidelity
against a sheet that is more specific than the spec it accompanies.

---

## Additions beyond the PRD

Things now in the repo that §6/§7 don't mention, and why.

| Addition | Why |
|---|---|
| `galleries` collection + `Slideshow` | A free-agent team's best recruiting asset is photos of people playing. §7 has a masonry gallery but no carousel, and the team asked for one. `GallerySlideshow.astro` renders the shared mascot empty state until photos exist, so it's safe to ship before the photography |
| `faqs` collection | Feeds the About accordion and the `FAQPage` structured data in §10.3 |
| Facebook **Page** embed | §8.3 ruled out an embedded feed on the assumption the team ran a *Group*, which genuinely cannot be embedded. The team's presence is a **Page** (`facebook.com/leftoverspb`), and Meta's Page Plugin does embed Pages. Wired behind `facebookPagePlugin.enabled`, **off by default**: the plugin loads Meta's SDK and sets cookies, which would make the footer's "no trackers, no cookies" line untrue. Turning it on means changing that copy and allowlisting `facebook.net`/`facebook.com` in `_headers` |
| shadcn token bridge | Keeps one colour system instead of two (see the §4 deviation) |
