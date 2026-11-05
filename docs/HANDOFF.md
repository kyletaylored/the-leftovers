# Handoff: The Leftovers website

**Start here** if you're picking this project up, whether you're a person or an
agent. It covers what the site is, what state it's in (as of **5 Nov 2026**),
how to work on it without breaking its rules, and what's left to do. Everything
else in `docs/` goes deeper on one topic.

| Read | For |
|---|---|
| This file | Orientation, current state, open work |
| [`AGENTS.md`](../AGENTS.md) | The rules for changing code: design system, components, verification |
| [`PRD.md`](PRD.md) | The original v1 spec. Every "§n" in the repo points here |
| [`PRD-CONFORMANCE.md`](PRD-CONFORMANCE.md) | Section by section: what shipped, what deviates from the PRD and why |
| [`EDITING.md`](EDITING.md) | Content editing for the team, no code (Pages CMS) |
| [`DEPLOY.md`](DEPLOY.md) | Hosting, domain, CMS setup, the Cloudflare move |
| [`PREORDERS.md`](PREORDERS.md) · [`JOIN.md`](JOIN.md) | How the two on-site forms submit, and their Google Forms |
| [`ANALYTICS.md`](ANALYTICS.md) | Google Tag Manager and Datadog RUM, both behind the cookie banner |
| [`COMPONENTS.md`](COMPONENTS.md) | Generated component brief for AI agents: rules, page recipes, classes, every component's options |
| [`SEO.md`](SEO.md) | Sitemap, robots.txt, llms.txt, hiding pages from search, Google Search Console setup |
| [`/design`](../src/pages/design.astro) + Storybook | The live design system (see "Design system" below) |

---

## 1. What this is

**The Leftovers** is a semi-pro, community-run paintball team. The roster is
rotating free agents: anyone who'll show up and play a tournament can join. The
site is its home base. Its jobs are:

1. **Show the brand**: the takeout-box mascot, the brush wordmark, gold ribbed
   numerals, ruyi clouds, terraced mountains.
2. **Give people a reason to come back**: events and the season record.
3. **Convert visitors** into players (`/join`), community members (socials,
   mailing list) and buyers (jersey pre-orders).

Live at **https://theleftoverspb.com**. The repo is
`kyletaylored/the-leftovers` and it's **public**.

### The constraints everything else follows from

These come straight from the PRD (§1, §2, §4). Don't break them without the
team deciding to:

- **No backend, no database, no accounts.** It's a static site. Content is
  flat files in this repo. Anything dynamic goes to a free third party: orders
  and join requests go to Google Forms, the mailing list posts to its provider,
  and the store is an external link.
- **$0 to run.** Free hosting, free CMS, no subscriptions.
- **A non-developer can update it.** Team members, events, landing pages and
  pre-orders are all editable in Pages CMS. A save is a commit to `main`, and
  that triggers a deploy.
- **Mobile-first, fast, and SEO-correct are launch requirements**, not polish
  (§10). Lighthouse mobile scores are ≥ 90 everywhere, and in practice ~97–100.
- **WCAG AA.** The brand crimson fails as text (2.2:1), which is why every
  accent colour has a separate *fill* token and *text* token.

---

## 2. Current state (Nov 2026)

### Pages

| Route | What it is | Notes |
|---|---|---|
| `/[slug]`, `/preview/[slug]` | `landing` pages composed in Pages CMS: published, and drafts (noindex) | `BlockRenderer`. `/preview/home` is the homepage rebuilt as blocks; `index.astro` is still what's live |
| `/` | Home ("direction B"): ornate sand hero, `ImpactBand` manifesto, full-width showcase slider, "How it works" `TwoColumn` CTA, crimson free-agents `ImpactBand`, "2027 Season Loading…" + league logos, newsletter | Direction B promoted Nov 2026 |
| `/gallery` | All 61 event photos: large photo, paged thumbnail grid, lightbox with magnifier, lazy loaded | Footer link only (`footerNav` in `site.yml`) |
| `/about`, `/roster`, `/stats` | Redirect stubs: the first two go home, `/stats` goes to `/events` | `/team` was removed Nov 2026; see §7 for the planned `/about` |
| `/events` | Next event with countdown and squads, how it works and fees, then each season's `SeasonStrip` and results | Unhidden 5 Nov 2026, in the nav and sitemap |
| `/shop` | Pre-order drops + evergreen products (`ProductGrid`) | **Hidden.** Products collection is empty on purpose |
| `/preorder/[slug]` | One page per jersey drop, with an on-site order form | `PreorderForm` island → Google Form |
| `/join` | "Request to play" form | `JoinRequestForm` island → Google Form ([JOIN.md](JOIN.md)) |
| `/community` | Social links, optional Instagram/Facebook embeds, newsletter | **Hidden.** No Discord right now (see below) |
| `/contact` | Contact, with the partner logos (Infamous, Kinetic) | |
| `/privacy` · `/terms` | Privacy Policy & Terms and Conditions | Linked in the footer alongside Cookie settings |
| `/design` | Design system reference | `noindex`, not in the sitemap. For builders, not visitors |
| `404` | Mascot empty state | |

**Hidden pages** (Shop, Community) still build but are `noindex`,
out of the sitemap, out of the nav and footer, and unlinked from visible pages.
They're hidden by `seo.noindex: true` in their `src/content/pages/*.md` (the
CMS's "Hide from search engines" box), and the sitemap follows that tag
automatically ([SEO.md](SEO.md)). To bring one back: untick the box and re-add
it to `nav` in `site.yml`. `/preorder/[slug]` is not
linked from anywhere either, but its closed state still points at `/shop` and
`/community`.

### Built and working

- All 7 PRD content collections plus `faqs`, `galleries`, `preorders` and `landing` (the page builder: [EDITING.md](EDITING.md#building-a-landing-page)).
  Schemas are in `src/content.config.ts` and CMS forms in `.pages.yml`.
  **Every image field has a required `alt`.**
- The record is derived, never typed: `/events` works it out from each event's
  squads (`src/lib/events.ts`). `TeamStatsWidget` can show live team stats from
  **pblidb.org** (an unofficial public API, fetched at build time, fails soft;
  see `src/lib/pblidb.ts`).
- Upcoming vs past is computed from dates (`src/lib/events.ts`). Nobody flips a
  status flag.
- SEO: sitemap, robots, canonical URLs, per-page OG and Twitter tags, and
  JSON-LD (`SportsTeam`, `Person`, `SportsEvent`, `Product`, `FAQPage`).
- Design system: the `/design` page, Storybook with play tests, and shared
  token and texture data. See §4.
- Wide screens: past 1600px the whole site sits in a centred page frame over
  a dimmed seigaiha surround (`src/lib/layout.ts`, `.site-frame` in
  `global.css`). Full-bleed images size to the frame (`FULL_BLEED_SIZES`).

### Content is mostly placeholder

The *code* is launch-ready. A lot of the *content* isn't. Don't mistake one for
the other:

- **Event photos are imported but not placed.** 56 event photos (2400px WebP,
  ~21 MB total) sit in `src/assets/img/events/<event-code>/` (`nxl-mwo25`,
  `nxl-lso26`, `icpl-poc25`, `social` for Facebook pulls, `unsorted` for
  untagged `DSC_*` shots, and so on). Nothing references them yet: they have no
  alt text, galleries are still empty, player photos don't exist, and heroes
  still use the motif header. League logos are in `src/assets/img/sponsors/`
  (`icpl`, `infamous`, `kinetic`, `nxl-eu`, `nxl-us`) with no sponsor entries.
  The folder codes come from the photographers' filenames, not confirmed event
  names. Rename a folder if you know the real name, and fix any paths.
- **Team members are placeholders in part.** Kyle's bio predates this list and
  needs his review. Matt Engles has no bio or photo yet, and both roles are
  a generic "Organizer".
- **Events are real.** All 10 NXL US events from 2025–26 were copied from
  PBLeagues on 5 Nov 2026: venues, squads and final places. Check before
  trusting:
  - World Cup 2026 lists all 24 entries, but 11 weren't marked paid that day.
    Remove any that drop out.
  - Its street is `5990 W Osceola Parkway`, from the NXL's page. PBLeagues and
    the NXL's map link say 6000. The venue has no published name.
  - 2025's Cuban-flagged "Leftovers" (Open 3v3) was left out as not ours.
  - Non-NXL events aren't backfilled.
- **Products: empty on purpose.** The folder has a README explaining why. Astro logs "collection … is empty" warnings on every build;
  that's expected.
- **The jersey pre-order** (`preorders/2026-leftovers-jersey.md`) has
  `closesAt: 2026-10-02`, which is in the past. Check with the team whether that
  drop is closed (set `status`) or extended.

### Deliberate deviations from the PRD

These are all recorded with their reasons in
[PRD-CONFORMANCE.md](PRD-CONFORMANCE.md). Don't "fix" them back to the PRD:

| PRD says | Built | Why |
|---|---|---|
| Svelte islands (§4) | **React 19 + shadcn/ui**, every island `client:visible` | Team's call, for tooling. Costs ~4× the JS, but mobile scores held |
| Cloudflare Pages (§4.1) | **GitHub Pages** (`.github/workflows/deploy.yml`) | Team's call. Cloudflare config is committed and ready |
| 8-page site map (§5) | No About, Roster or Stats page for now | `/team` merged them, then was removed. An `/about` page is planned |
| Free wordmark font, subset (§9) | **CC Monster Mash Worn**, licensed, **not** subset | The licence forbids subsetting. Per-domain licence, see `ATTRIBUTIONS.md` |
| Discord as the hub (§8.3) | **No Discord**; `/join` form instead | The team doesn't run one right now. Discord UI hides itself while `social.discord` is empty |
| `results` collection, player stats and a roster (§6, §8.1) | Removed. Squads and places live on each event, and `team` lists organizers | Players rotate, and nobody was hand-entering stats |
| Payment off-site via Bonfire (§8.2) | Pre-orders collect **orders** on-site via Google Forms, and payment is arranged manually | No store chosen yet. Still zero payment/PCI surface |

---

## 3. How the code is organised

```
src/
  content.config.ts      Zod schemas: the contract .pages.yml has to satisfy
  content/<collection>/  One file per player, event, preorder, page…
  data/site.yml          Site settings: nav, socials, mailing list, embeds, form URLs
  lib/                   Build-time logic, plus the data shared by /design and Storybook
    events.ts format.ts settings.ts images.ts pblidb.ts
    palette.ts icons.ts textures.ts clouds.ts
  components/
    brand/               Icon, Wordmark, MascotMark, RuyiCloud, TerracedDivider, Lantern, Badge
    ui/ form/ marketing/ Pill, carousel · FormField/Radio/Checkbox · FeatureRow/PricingCard/ProductGrid
    design/              DocSection, Specimen: chrome for /design only
    *.astro              The component library (PRD §7)
    *.tsx                React islands (+ *.stories.tsx next to each)
  pages/                 One file per route (redirect stubs are .ts)
  styles/global.css      @theme tokens, .numeral, .eyebrow, .field-*, .bg-* textures, shadcn bridge
src/stories/foundations/ Storybook: Colors, Typography, Icons, Textures
scripts/                 make-og-default, prep-brand-assets, make-pattern-tiles
public/_headers          Strict CSP + security headers (Cloudflare only: inert on GitHub Pages)
.pages.yml               Pages CMS config
docs/design/             Committed, downsized reference plates (see §6)
```

### React islands

| Island | Used on | Server half |
|---|---|---|
| `CountdownIsland` | `/events`, `/shop`, preorders | `Countdown.astro` pins the first value so hydration matches |
| `Slideshow` | `/`, `/gallery`, `/community`, `/design` | `GallerySlideshow.astro` optimises images at build time |
| `Calendar` | `/design` only | `EventsCalendar.astro`. Day links are plain `#slug` anchors that work without JS |
| `PreorderForm` · `ProductGallery` | `/preorder/[slug]` | The page passes the drop's data |
| `JoinRequestForm` | `/join` | Events list comes from the collection |
| `CookieConsent` | Every page (`BaseLayout`), `/design` | Gates Google Tag Manager (`site.gtmId`) behind EU/GDPR opt-in consent |

Everything else is plain Astro or CSS. That includes the nav toggle (vanilla
JS), the FAQ (`<details>`), the marquee and the hero cross-fade (CSS).

---

## 4. Design system: how to build a page or component

The full rules are in [`AGENTS.md`](../AGENTS.md#design-system). In short:

- **`/design`** (`npm run dev` → `/design`) has a live example of every Astro
  and React component, plus tokens, motifs, icons and textures, and a
  **component index** table. Check it before building anything. If a component
  almost fits, extend it with a prop rather than forking it.
- **Storybook** (`npm run storybook`) covers **Foundations** (colours,
  typography, icons, textures) and the **React islands**, each with a `play`
  test that `npx vitest run` runs headlessly. It can't render `.astro` files.
- Both read the same data: `src/lib/palette.ts`, `icons.ts` and `textures.ts`.
  Edit the data file, not either page.
- **A component change ships with its documentation in the same change**:
  update its `/design` example, its index row, and a story if it's an island.

### Brand quick reference

- **Colours:** `ink` (near-black base), `crimson` (fill) / `crimson-400`
  (text), `gold` (fill and stroke) / `gold-300` (text), `forest`, `tan`,
  `bone`. Never type a raw hex in a component. The `/design` page's cream
  "paper" chrome is the only exception.
- **Type:** Gasoek One (`font-display`, every uppercase heading; replaced
  Anton in Nov 2026), Inter (`font-sans`, body text), CC Monster Mash Worn
  (`font-marker`, wordmark/logo only). The gold ribbed numeral is the
  `.numeral` CSS class, not a font.
- **Motifs:** `RuyiCloud` (licensed Vecteezy art, attribution required),
  `TerracedDivider` (`rice-terrace` default, `pagoda` for the homepage hero
  only), `Lantern`, `MascotMark` (empty states).
- **Textures:** `.bg-topo`, `.bg-sand` and `.bg-seigaiha` are safe behind
  text. `.bg-sand-bold` and `.bg-seigaiha-bold` are decorative only. Sand is
  the contour-line pattern from the jersey body (`docs/design/jersey-sample.webp`),
  and seigaiha is the traditional wave-scale pattern. Both are generated by
  `scripts/make-pattern-tiles.mjs`, so never hand-edit the SVGs. Sand is
  the standard header pattern (Nov 2026): the homepage `Hero`, every
  `PageHeader` without photos, and the footer all use it. `PageHeader`
  takes a `pattern` prop for the rare page that should differ.
- **CSP:** `img-src 'self' data:` and `font-src 'self'`. Images and fonts must
  be local. Any third-party embed needs its origin added to `public/_headers`.

---

## 5. Working on it

```bash
npm install
npm run dev              # http://localhost:4321  (/design for the system)
npm run build            # astro check + astro build: must be 0 errors
npx vitest run           # every Storybook play test, headless Chromium
npm run storybook        # http://localhost:6006
node scripts/make-pattern-tiles.mjs   # regenerate the sand/seigaiha tiles
npm run og               # after npm run build: screenshot /design/og-card into public/og-default.png
```

- **Deploy = push to `main`.** GitHub Actions builds and publishes in about two
  minutes. A failed `astro check` (a type error, or content that doesn't match
  its schema) fails the build, and the live site keeps serving the last good
  version.
- **CMS edits land as commits on `main`**, so pull before you push.
- Commit straight to `main` (that's this repo's history), or use a PR if the
  owner asks.
- **Known build noise:** "collection products is empty"
  warnings, and two `FormEvent` deprecation hints. All expected.
- `_reference/` (gitignored, local only) holds the full-resolution originals.
  See §6.

---

## 6. Reference material

The committed copies are in `docs/design/` (downsized WebP). The originals are
in the gitignored `_reference/`, which only exists on the owner's machine.

| Committed | Original in `_reference/` | What it is | Status |
|---|---|---|---|
| `brand-guide.webp` | `style-1.png` | Locked palette, motifs, type roles, mascot, icon set | Source of `global.css` and `brand/` |
| `ui-components.webp` | `style-2.png` | Component states: buttons, fields, badges, cards, toast | Deltas tracked in PRD-CONFORMANCE |
| `component-library-mobile.webp` | `style-3.jpeg` | Component library v2 + **mobile references** (home, roster, nav) | Mobile nav and cards built. Use it to check phone layouts |
| `homepage-mockup-a.webp` | `homepage-1.png` | Homepage direction A | **Built** |
| `homepage-mockup-b.webp` | `homepage-3.png` | Direction B: photo manifesto band, crimson next-up band | **Built and live on `/`** (Nov 2026): ornate `Hero`, `ImpactBand`, showcase slider, `TwoColumn` CTA |
| `homepage-mockup-c.webp` | `homepage-2.jpeg` | Photo-variant PlayerCards, multi-product shop row, footer | Photo variant waiting on player photos |
| `jersey-sample.webp` | `leftovers-jersey-sample.png` | The real jersey art: contour waves, clouds, terraces, lanterns | The source of the sand texture |
| `src/assets/img/brand/golden-contour-waves.png` | `Golden Contour Waves on Black.png` | Sand/zen-garden source art | Shipped as asset + `.bg-sand*` |
| `src/assets/img/brand/seigaiha.png` | `Seigaiha Pattern.png` | Wave-scale source art (white on transparent) | Shipped as asset + `.bg-seigaiha*` |
| `docs/PRD.md` | `the-leftovers-website-PRD.md` | The v1 spec | Verbatim copy |
| *(not committed)* | `design_handoff_leftovers_audit/` | Sept 2026 design audit: Storybook + 7 page mockups (`.dc.html`) | Mostly built. See PRD-CONFORMANCE "Design-handoff audit" |
| *(not committed)* | `Leftovers_Design_Storybook/` | The storybook that `/design` was ported from | Ported to `/design` (Nov 2026) |
| *(not committed)* | `fx111i MonsterMash/` | Licensed font download | WOFF2 ships from `src/assets/fonts/`. **Never commit the OTF/TTF** (desktop licence) |
| *(not committed)* | `roster_form.md` | Spec for the join-request Google Form | Built. See [JOIN.md](JOIN.md) |
| *(not committed)* | `leftover-jersey.png`, `homepage-*.png` | Full-res originals of the above | |

The `.dc.html` mockups are **references, not code**. Rebuild what they show
with the real components, tokens and content collections. Never paste their
inline-styled HTML into the repo.

---

## 7. Open work, in priority order

### Needs the team (decisions or content, not code)

- **Connect Google Search Console and submit the sitemap.** Verify the
   `theleftoverspb.com` Domain property by DNS, then submit
   `/sitemap-index.xml`; import into Bing Webmaster Tools from there. Steps
   in [SEO.md](SEO.md#connecting-google-search-console-one-off-by-the-owner).
   Also decide the AI-crawler policy (`search.aiCrawlers`, default `allow`).

0. **Review the homepage slider headlines** in
   `src/content/galleries/game-day.yml` ("Off the break", "Full send"…). They
   are placeholder copy written from what each photo shows; edit them in the
   CMS under Photo galleries → Game day.

1. **Photography, placement and player photos.** Event photos are in; they need
   curating. All 61 are on `/gallery` with alt text, grouped by event in `src/content/galleries/`.
   Confirm the gallery titles: they come from folder codes. Player photos are still missing. It unblocks player photos,
   galleries, the mockup-B manifesto band, the `Hero` video variant, and real
   carousel slides on `/design`.
2. **Finish the team members.** Add Matt's bio and photo, real roles, and
   review Kyle's bio.
3. **Close or extend the jersey pre-order** (its close date has passed).
4. **Mailing list:** `mailingList.formAction` in `site.yml` is empty. Pick
   Buttondown or Mailchimp and paste in the form action.
5. **Instagram widget:** pick a free-tier provider and set `instagramWidget`.
   Allowlist its origin in `public/_headers`.
6. **Store for evergreen merch** (Bonfire or Fourthwall). Then add `products`
   entries with a `buyUrl`.
7. **Name a day-to-day content owner** (PRD §13, still open).

### Ready to build (code)

0. **Build `/about`.** List team members as cards alternating left and right,
   each with image, name, bio and socials. The `team` collection is ready and
   `ProfileCard` is the closest component. Replace the stub at
   `src/pages/about.ts`. The FAQs and `TeamStatsWidget` have no public page right
   now, so decide whether they belong there. pblidb is still backfilling, and most
   squads have no results yet; `OUR_TEAMS` in `src/lib/pblidb.ts` lists all four
   records for the main team until it's clear which are ours.
0. **Decide whether the homepage moves to blocks.** `/preview/home` matches   `index.astro` from `src/content/landing/home.yml`. Moving would make the   homepage editable in Pages CMS and take its copy out of the template, but   `index.astro` also emits the `WebSite` schema, which would need a home.
1. **Move hosting to Cloudflare Pages.** This turns on the CSP and security
   headers, real `_redirects` and preview deploys. Everything needed is
   committed; the steps are in [DEPLOY.md](DEPLOY.md#moving-to-cloudflare-pages).
2. **Phase 2 (PRD §12): `/news` recap posts.** For now `/news` redirects to
   `/events`.
3. **Phase 3: a CSV importer** that turns a PBLI results export into the
   squad places on each `events` entry.
4. **More texture on real pages.** The homepage `Hero` now uses `.bg-sand`.
   `<Section tone="sand|seigaiha">` is ready for more: a seigaiha band on
   `/events`.
5. **Components that are built and documented on `/design` but not used on
   any public page yet.** Place each one once its content exists:
   - `FeatureRow`: waiting on photos.
   - `SponsorMarquee`: waiting on enough sponsors to scroll. Two partners
     (Infamous, Kinetic) now show on Contact through `LogoStrip`.
   - `PricingCard`: its "Sponsor a Slot" tier idea needs a business decision.
   - `Toast`: nothing triggers it yet.
   - `AgendaList`, `ImagePlaceholder`, `RadioGroup`, `CheckboxGroup`.
   - `Ticker` (`/design#motion`): a ticker under the nav for the next
     event is the obvious candidate, but not in the same view as the
     animated homepage hero. (`<Hero animate>`, drifting sand + swaying
     terraces, is live on the homepage since 5 Nov 2026.)
6. **Admin view for join requests and payments.** Researched, not built. See
   [JOIN.md](JOIN.md#a-real-admin-interface-researched-not-built).

### Don't do

- Don't add a server, database, login or checkout. That would break the core
  constraint. Use a third party instead.
- Don't add a tracking or cookie-setting script without gating it behind
  `CookieConsent` (EU / GDPR opt-in) and disclosing it on `/privacy`. The
  Facebook Page plugin stays off unless gated the same way.
- Don't subset, convert or commit the desktop versions of the licensed brush
  font.
- Don't type derived numbers (win rates, records) into content.
- Don't hand-roll a component that's already on `/design`.
