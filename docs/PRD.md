<!--
  Committed copy of _reference/the-leftovers-website-PRD.md (Draft v1,
  2026-09-16, md5 b0bbf4e3deede168bdb3f9d4c7a27435), so a fresh clone has the
  spec that every "§n" reference in this repo points into.

  This is the ORIGINAL v1 contract, kept verbatim. Don't edit it to match the
  build. Where the site deliberately differs (React instead of Svelte, GitHub
  Pages instead of Cloudflare, the /team page merge, the licensed wordmark
  font, and others), the deviation and its reason are in
  docs/PRD-CONFORMANCE.md. Current state and next steps: docs/HANDOFF.md.
-->

# The Leftovers — Website PRD

**Status:** Draft v1
**Owner:** Team Leftovers admin/captain
**Last updated:** 2026-09-16

---

## 1. Overview

The Leftovers is a semi-professional, community-driven paintball team built from
rotating free agents — anyone willing to show up and play a tournament can join
the roster. The website is the team's home base: it establishes the brand
identity (the takeout-box mascot, brush-lettered wordmark, gold ribbed numerals,
terraced-mountain divider — see the existing style guide), gives fans and
prospective players a reason to check back (stats, calendar, roster), and
funnels people into the community (Facebook group, Instagram, Discord, mailing
list) and the shop (jersey pre-orders, apparel).

**Format:** static site, no backend of our own, no database, no user accounts.
Everything either lives in flat content files edited through a CMS, or is
handed off to a third-party service (payments, email, social feeds) that
already solves that problem for free or near-free.

## 2. Goals

1. Give the team a real home that reflects the brand (not a generic template).
2. Make it trivially easy for a non-developer on the team to update the
   roster, post an event, or add a stat line — no Git knowledge required.
3. Turn site visitors into community members (mailing list, Discord, Facebook
   group) and into customers (jersey pre-orders, merch) without building or
   paying for a full e-commerce stack.
4. Surface tournament performance (PBLeague results) in a way that feels like
   a stats page, not a spreadsheet dump.
5. Ship on free or near-free infrastructure — no monthly hosting bill, no
   forced SaaS subscription to launch.
6. Treat **mobile-first, performance, and SEO** as first-class constraints
   that shape the framework/component choices below — not a polish pass
   bolted on after launch (see §4, §10).

### Non-goals (v1)

- No live, automatic sync with PBLeague's system (no public API exists — see
  §8.1).
- No payment processing, cart, or checkout hosted on our own infrastructure.
- No user login/accounts — "joining the roster" is a real-world/Discord/CMS
  process, not a self-serve web signup flow.
- No CMS-driven e-commerce inventory management.

## 3. Users

| User | Needs |
|---|---|
| Prospective free agent | See the team's vibe, see there's an open slot, know how to reach out / where the Discord or group is |
| Current roster member | Bio/photo on the roster, see upcoming events, check their own stats |
| Fan / friend / parent | Follow results, watch social feeds, buy merch |
| Team admin (content editor) | Add/edit players, events, and stats after a tournament, without touching code |

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** | Static output by default, component islands only where needed (e.g. a countdown timer or filterable stat table), ships near-zero JS otherwise. Matches the "traditional components + custom components" model directly (`.astro` components). |
| Styling | **Tailwind CSS** + CSS custom properties for brand tokens | Utility classes map cleanly onto a component library; custom properties (`--color-crimson`, `--color-gold`, etc.) keep the brand palette as a single source of truth pulled from the style guide. Tailwind's mobile-first breakpoint system (`sm:`/`md:`/`lg:` add complexity going *up* from a mobile base) matches the mobile-first requirement directly. |
| Interactive "islands" | **Astro islands, framework-light** — plain Astro/vanilla JS or Alpine.js for simple bits (mobile nav toggle, accordion, countdown); reach for **Svelte** only where an island needs real state (e.g. the sortable/filterable `StatLeaderboardTable`) | This is the actual "performant UI framework" decision: Astro ships **zero JS by default** and only hydrates the specific components marked as islands, so the framework choice only matters for that small handful of interactive widgets — it doesn't touch the rest of the page. Svelte compiles to a few KB of vanilla JS with no client-side runtime, which matters far more for a mobile-first, image-heavy sports site than React's larger ecosystem would help with. Avoid pulling in React/Vue/a full SPA framework unless a specific feature later demands it. |
| Content / CMS | **Pages CMS** (pagescms.org) | Free, open-source, git-native — content is stored as Markdown/YAML/JSON directly in the repo and edited through a hosted visual UI (app.pagescms.org) that commits on your behalf. No database, no separate backend, no npm package to install. Config lives in a `.pages.yml` file and maps cleanly onto Astro content collections. |
| Repo / version control | **GitHub** | Required by Pages CMS (GitHub App-based auth); also the natural home for CI. |
| Hosting | **Cloudflare Pages** (primary) or **GitHub Pages** (fallback) — see §4.1 | Both are free for this traffic level; Cloudflare gives more headroom to grow into. |
| CI/CD | GitHub → auto-build on push (native to both hosts) | Every CMS save = a commit = an automatic rebuild/deploy. No manual deploy step ever. |
| Forms (mailing list) | Native `<form>` posting directly to the email provider (Buttondown or Mailchimp) | Zero backend, zero PII passing through our own infra. |
| Analytics | Cloudflare Web Analytics (free, no cookies) if hosted on Cloudflare Pages | Privacy-friendly, no consent banner needed. |

### 4.1 Cloudflare Pages vs. GitHub Pages

| | Cloudflare Pages | GitHub Pages |
|---|---|---|
| Cost | Free | Free |
| Custom headers / redirects | Yes (`_headers`, `_redirects`) — useful for CSP tweaks some embed widgets need | Limited (no native custom headers) |
| Preview deployments per PR | Yes, automatic | Not native |
| Edge Functions (future-proofing) | Available if we ever need a tiny serverless endpoint (e.g. a future form relay) | Not available |
| Setup simplicity | Connect repo, pick build command | Slightly simpler if staying 100% inside GitHub |

**Recommendation:** Cloudflare Pages. The repo still lives on GitHub (Pages CMS
requires this), so we get GitHub for content/version-control and Cloudflare for
the actual serving — best of both, and it leaves room to add a Pages Function
later if we ever need one (e.g., a proxy endpoint) without re-platforming.

## 5. Site Map

- `/` — Home
- `/about` — About the team / origin story
- `/roster` — Team / Players (includes "open slot" join CTA)
- `/stats` — Tournament Stats & Standings
- `/events` — Events & Calendar
- `/shop` — Shop & Pre-Orders
- `/community` — Facebook / Instagram / Discord / mailing list hub
- `/contact` — Contact
- `/news` *(phase 2, optional)* — Recap posts per event

## 6. Content Model (Pages CMS collections)

Each collection below is a `.pages.yml` collection backed by Markdown/YAML
files in the repo, editable in the Pages CMS UI.

| Collection | Key fields |
|---|---|
| `players` | name, jersey number, role/position, photo, short bio, socials, status (`active` \| `open-slot`), joined-date |
| `events` | title, PBLeague league/series tag, start date, end date, location, registration URL, status (`upcoming` \| `past`), cover image, result summary (free text, filled in after the event) |
| `results` | event ref, per-player or team-level stat fields (see §8.1 — filled in manually), final placement |
| `sponsors` | name, logo, URL, tier |
| `products` | name, image, price, external buy link (Bonfire/Fourthwall product URL), status (`available` \| `pre-order` \| `sold-out`) — the site never handles payment, just teases and links out |
| `pages` (about/contact/etc.) | title, body (rich text), SEO fields |
| `site-settings` | nav labels, footer text, social URLs, Discord invite link, mailing-list provider form action URL |

Every image field across these collections (player photos, event covers,
product images, sponsor logos) ships with a **required `alt` text field**
alongside it — both an accessibility requirement and a real SEO input (image
search, rich results). This is enforced at the CMS level (`.pages.yml` marks
`alt` as required wherever an image field exists), not left to whoever's
typing fastest after a tournament.

## 7. Component Library

### Traditional components
- Hero (with image / with video bg / text-only)
- Two-column (image+text, either side)
- Three-column (icon/feature grid)
- Wide banner / CTA strip
- Callout / pull-quote block
- Generic profile/bio card
- Image gallery / masonry grid
- Sponsor logo marquee
- Countdown timer
- FAQ accordion
- Newsletter signup block
- Social embed block (wraps whichever widget script per §8.3)

### Custom components
- **PlayerCard** — jersey-style card: big ghost-type jersey number behind photo, gold ribbed-numeral treatment, name bar, role tag, status variant that renders as a dashed-border **"OPEN SLOT — JOIN THE ROSTER"** card with the mascot instead of a photo when `status: open-slot`
- **EventCard** — date badge, location, PBLeague tag, register/result CTA, terraced-mountain divider as card footer
- **StatLeaderboardTable** — sortable/filterable table styled like the stats mockup, gold highlight on top row
- **TerracedDivider** — reusable SVG mountain-silhouette section break (brand signature element, used between most sections)
- **MascotCallout** — the takeout-box mascot in empty states, 404 page, loading states, "no events scheduled" states
- **SponsorMarquee** — auto-scrolling sponsor strip

## 8. Feature Specs

### 8.1 Stats & Standings — data source reality check

There is **no public PBLeague/PBLI API.** PBLI's tournament system exports
player/results data as a downloadable file for the event organizer, not as a
live feed a third-party site can pull from. This changes the plan for this
page from "auto-sync dashboard" to "structured manual entry":

- **v1 (MVP):** After each event, the team admin exports/collects results and
  enters them into the `results` collection via Pages CMS (a normal form —
  no CSV parsing needed for launch). The page renders whatever's in that
  collection as a leaderboard/table.
- **Phase 2:** If entry volume grows, build a small CSV-import script (run
  locally or as a one-off GitHub Action) that converts PBLI's exported file
  into the `results` collection's file format, so the admin uploads a file
  instead of retyping rows.
- **Phase 3 (stretch, not committed):** Reach out to PBLI directly about a
  data-sharing arrangement, or evaluate scraping — scraping carries ToS and
  fragility risk and shouldn't be assumed as a v1 dependency.

### 8.2 Shop & pre-orders — bootstrapped options compared

| Option | Cost | Fits pre-order/batch model? | Site integration |
|---|---|---|---|
| **Bonfire** | $0 platform fee; you set your price over base cost | **Yes — built for exactly this.** Campaigns run in 2–21 day "batches": you open a campaign, collect orders/payment up front, printing happens once the batch closes. This is the standard team/booster-club jersey pre-order model. | No embeddable cart; link out to the campaign page from a "Pre-Order Now" CTA/card |
| **Fourthwall** | Free plan; Pro is $19/mo (waives digital-product fee) | Partially — it's built more for an always-open storefront (true print-on-demand, order any time) than a batch pre-order, though you can still time a "drop." Operates as merchant of record (handles sales tax for you). | Can't embed the full shop (nav/cart) as one widget — only individual product-page iframes or a Storefront-API custom build. Simplest v1 use is still a link-out button. |
| **Snipcart + a POD supplier (e.g. Printful)** | $20/mo flat under $1k in sales, or 2% per transaction above that | No — it's a cart layer, not a batch/fundraiser tool; you'd be assembling the batch logic yourself | Deepest site integration (real in-page cart, no redirect) but the most setup work and the first recurring cost |

**Recommendation:** Use **Bonfire** for the actual jersey pre-order drop (it's
free and it's the exact mechanic — batch, minimum-free, prints after the
window closes) and optionally a standing **Bonfire or Fourthwall "always-open"
shop** for evergreen small items (stickers, hats). The site itself stays
100% static v1: a `products` collection renders teaser cards with price and a
"Pre-Order" button that link out to the live Bonfire/Fourthwall page. This
keeps zero payment/PCI surface on our own infrastructure and costs nothing to
launch. Revisit Snipcart if/when the team wants a no-redirect, fully in-brand
checkout badly enough to justify $20/mo.

### 8.3 Social & community integration

| Channel | Reality | Plan |
|---|---|---|
| **Facebook Group** | Facebook no longer offers a reliable embeddable feed for **Groups** (the old Page Plugin only supports public **Pages**, not Groups). Don't plan around embedding group posts. | A prominent "Join our Facebook Group" button that links out. If the team later runs a public Facebook *Page* too, that can be embedded via Meta's Page Plugin. |
| **Instagram** | Instagram's own embed is single-post only (no live feed API for casual use). A live-refreshing grid needs a third-party aggregator. | Use a widget service free tier (e.g. Elfsight, Juicer, or SnapWidget) — drop-in script tag, auto-refreshes every 1–2 days on free tiers. Budget for a small paid tier if the free view/post cap gets hit. |
| **Discord** | Great natural fit for a free-agent/pickup-roster team; Discord provides an **official, free server widget** (invite + live member count) with no auth required for a public server. | Add a Discord widget/invite block to the Community page and footer — this is likely the actual hub where "who's playing next tournament" coordination happens. |
| **Mailing list** | Needs zero backend if the form posts straight to the provider. | Buttondown (simple, generous free tier, newsletter-friendly) or Mailchimp free tier — either way, a native HTML form with the provider's action URL, no custom code. |

## 9. Design System Application

All pages consume the same token set established in the brand style guide:

- Color tokens: near-black base, crimson red, antique gold, forest green,
  terrain-tan — implemented as CSS custom properties, exposed to Tailwind via
  `theme.extend.colors`.
- Type tokens — four distinct roles, not one "brand font":
  - **Wordmark** (logo only, never live body text): a distressed dry-brush
    display style. Free starting point: **Permanent Marker** (Google
    Fonts); closer thematic match: **Rubik Wet Paint** (Google Fonts,
    leans more "dripping" than "dry brush" — preview first). For a tighter
    match to the locked logo art, license a "distressed brush display" /
    "grunge sports lettering" face from Adobe Fonts or Fontspring
    (~$15–40). Regardless of source, treat the wordmark as a static
    SVG/logo asset site-wide rather than live-rendered text, so it
    doesn't depend on the font loading identically everywhere.
  - **Bold headline sans** (section headers, big statement lines — e.g.
    "MEET THE CREW"): **Anton** or **Bebas Neue** (both Google Fonts,
    free, condensed/heavy, standard for sports-branding impact type).
  - **Gold ribbed/chrome numerals** (jersey numbers, stat callouts): not a
    font — a *treatment* applied on top of Anton/Bebas Neue's numeral
    shapes. Implement as a gold gradient + repeating thin horizontal line
    pattern clipped to the text (`repeating-linear-gradient` background
    clipped with `background-clip: text`), not as a separate typeface.
  - **Body & UI text**: **Inter** (safe default, excellent small-size
    legibility, pairs naturally with a Tailwind stack) or **Space
    Grotesk** if Inter reads too neutral against the bold brand.
  - All four are free via Google Fonts except an optionally licensed
    wordmark face; load with `font-display: swap`, and subset whichever
    wordmark font is chosen to just the characters in "THE LEFTOVERS"
    since it only ever renders that one string (already noted as a
    launch requirement in §10.2).
- Motif components: `TerracedDivider`, ruyi-cloud corner graphics, lantern
  iconography, and the takeout-box mascot are treated as reusable brand
  assets (SVGs/illustrations), not one-off page decoration — so the "OPEN
  SLOT" player card, the 404 page, and the newsletter block all feel like
  the same team.

## 10. Non-Functional Requirements

### 10.1 Mobile-first

Design and build start at the smallest breakpoint and add complexity going
*up*, not the reverse:

- Layout: single-column base for all grids (roster, events, shop); Tailwind
  breakpoints add columns at `sm`/`md`/`lg`, never remove them at small
  sizes.
- Navigation: collapsed/hamburger nav on mobile behind a lightweight island
  (no full nav-framework needed); primary CTAs ("Join the Crew," "Pre-Order")
  stay reachable without opening the menu.
- Touch targets: minimum 44×44px for buttons, nav items, and card CTAs.
- Media weight: the brand's textured backgrounds and mascot/motif graphics
  are prime candidates to bloat mobile payloads if treated as large raster
  images — prefer SVG for flat motifs (ruyi clouds, terraced-mountain
  divider, lantern icons) and reserve raster/photography for actual photos,
  served through Astro's `<Image>` component with responsive `srcset` and
  lazy-loading below the fold.
- Test on an actual throttled mobile profile (Lighthouse mobile preset, not
  just desktop), since that's the default real-world visitor on a
  team/community site shared via social links.

### 10.2 Performance

- Target: Lighthouse **mobile** score ≥ 90 across Performance,
  Accessibility, Best Practices, and SEO — mobile is the binding constraint,
  not desktop.
- Core Web Vitals budget: LCP < 2.5s, CLS < 0.1, INP < 200ms on mobile.
- Astro's static output + partial hydration keeps JS shipped to near-zero
  on content pages by default; the "Interactive islands" decision in §4
  is what keeps that true even as the stats table and countdown widgets are
  added.
- Image optimization and font-loading (`font-display: swap`, subsetting the
  brush-lettered display face to the characters actually used) are launch
  requirements, not later cleanup.

### 10.3 SEO

- **Technical baseline:** `@astrojs/sitemap` for an auto-generated
  `sitemap.xml`, a `robots.txt`, canonical URLs on every page, and per-page
  title/description/OG + Twitter card image sourced from the `pages`
  collection's SEO fields (already in the content model).
- **Structured data (JSON-LD)** — this content model maps unusually well
  onto schema.org types, which is worth taking advantage of for rich
  results:
  - `players` → `Person` (optionally nested under a `SportsTeam` for the
    roster page)
  - `events` → `Event` (start/end date, location, and — once results land —
    outcome), which is what makes tournament dates eligible for Google's
    event rich results
  - `products` → `Product` with price/availability, even though checkout
    happens off-site on Bonfire/Fourthwall
- **On-page:** one `<h1>` per page, logical heading hierarchy per component
  (a `PlayerCard` or `EventCard` shouldn't introduce its own competing
  `<h1>`), descriptive link text on CTAs instead of bare "click here."
  Cross-link generously between roster ↔ stats ↔ events — internal linking
  between the collections is close to free once they're all Astro content
  collections, and it's a real ranking factor.
- **Performance-as-SEO:** Core Web Vitals (§10.2) are a direct Google
  ranking input, so the performance and SEO requirements aren't separate
  workstreams — a slow mobile page undermines the SEO goal regardless of
  how clean the metadata is.

### 10.4 Accessibility

- WCAG AA contrast — flagged explicitly because the brand's dark base with
  crimson/gold accents needs real contrast-checking on body text and button
  labels, not just headline treatments where lower contrast is more
  forgivable.
- Semantic HTML and keyboard navigability for every interactive island
  (mobile nav, accordion, sortable stat table).

## 11. Editorial Workflow

1. Team admin (and any trusted contributors) get GitHub repo access via the
   Pages CMS GitHub App.
2. Day-to-day edits (new player, new event, post-tournament results) happen
   entirely in the Pages CMS web UI — no local dev environment needed.
3. Every save = a commit to `main` = an automatic Cloudflare Pages build and
   deploy, live within roughly a minute.
4. Structural/component changes (new page types, new components) go through
   normal code review in the repo.

## 12. Phased Rollout

**Phase 1 — MVP (launch):**
Home, About, Roster (with open-slot CTA), Events/Calendar, Contact,
Community hub (Facebook/Instagram/Discord links + mailing list signup), Shop
page as teaser cards linking out to Bonfire/Fourthwall. The mobile-first
layout, Core Web Vitals budget, sitemap/robots.txt, and per-page SEO
metadata + structured data (§10) all ship as part of this phase — they are
launch requirements, not a follow-up pass.

**Phase 2:**
Stats & Standings page live with manual `results` entry workflow; optional
News/recap blog per event; Instagram widget upgraded if the free tier caps
out.

**Phase 3 (stretch):**
CSV-import tooling for stats entry; evaluate a deeper Snipcart-based
in-brand checkout if merch volume justifies it; revisit a PBLI data
partnership.

## 13. Risks & Open Questions

- **Stats entry is manual labor** — no shortcut exists today without PBLI
  cooperation; this needs an owner on the team, not just a system.
- **Facebook Group content cannot be embedded** — set expectations early so
  no one designs a page section assuming otherwise.
- **Free-tier caps** on the Instagram widget and (if used) Bonfire/Fourthwall
  will need monitoring as the community grows.
- **Domain & DNS decision** still open — needed before Cloudflare Pages can
  attach a custom domain.
- **Who owns ongoing content edits** day-to-day — should be named before
  launch, not figured out after.

## 14. Reference Links

- Pages CMS — https://pagescms.org
- Astro CMS guide (Pages CMS) — https://docs.astro.build/en/guides/cms/pages-cms/
- Bonfire — https://www.bonfire.com
- Fourthwall — https://fourthwall.com
- Snipcart — https://snipcart.com
- PBLeagues (PBLI) — https://pbleagues.com
