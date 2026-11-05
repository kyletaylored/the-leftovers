# Components: the page-building brief

<!-- GENERATED from src/lib/components.ts by `npm run docs:components`. Edit that file, not this one. -->

Read this before building or changing a page. It replaces reading `src/pages/design.astro` (1,000+ lines) or every component file.

**Workflow (token-lean):**
1. Pick a recipe below and the components it names.
2. Copy real usage from one specimen only: `grep -n 'title="<Specimen title or component>' src/pages/design.astro`, then read ~40 lines from there. Or copy from the recipe's example page.
3. Need an exact prop type? Read only the `interface Props` block of that file, not the whole file.
4. Nothing fits? Extend the closest component with a prop (keep existing output unchanged), then add its specimen on /design and its entry in src/lib/components.ts.

## Rules

- One h1 per page, owned by PageHeader or Hero. Cards and blocks take an `as` heading prop: pass the right level.
- Copy comes from collections or src/data/site.yml, not hardcoded in the page. Missing content → MascotCallout / ImagePlaceholder, never invented content.
- Tokens only, never raw hex. Images from src/assets/img via <Image>/getImage (CSP: img-src self).
- Islands hydrate client:visible and never above the fold.
- Full-bleed means the page frame (max 1600px, src/lib/layout.ts), not the screen: use FULL_BLEED_SIZES for a full-width image, never sizes="100vw", and never 100vw/w-screen in CSS.
- Full-bleed blocks (ImpactBand, CtaStrip, Ticker, GallerySlideshow hero/showcase) sit between Sections; never two full-bleed photo blocks in a row.
- Motion stays ambient: drifting sand, swaying terraces and lanterns may share a hero, but never put a Ticker or an autoplaying slideshow in the same view as other motion.

## Page recipes

- **Interior page (default)** (`src/pages/contact.astro`): PageHeader (pattern sand) → Section tone=base → Section tone=alt → … alternate → CtaStrip or a closing Section with Buttons
- **Homepage / landing** (`src/pages/index.astro`): Hero variant=ornate animate (+RiceTerraces) → ImpactBand → GallerySlideshow layout=showcase → TwoColumn (boxed break) → ImpactBand tone=crimson → Section tone=seigaiha + LogoStrip → NewsletterBlock
- **Long-form / legal (Markdown body)** (`src/pages/privacy.astro`): PageHeader → Section tone=base > Prose > <Content /> → Buttons (outline + ghost)
- **Schedule** (`src/pages/events.astro`): PageHeader → Section: EventsCalendar → Section: Countdown + EventCard layout=feature (next) + EventCard grid (upcoming) → Section tone=alt: past EventCards, or MascotCallout when empty
- **Team / about** (`src/pages/team.astro`): PageHeader → story Section (Prose + StatNumbers + Callout) → roster Section (PlayerCard grid) → stats (StatLeaderboardTable / TeamStatsWidget, MascotCallout until data) → FaqAccordion → CtaStrip tone=forest
- **Shop / product** (`src/pages/shop.astro, src/pages/preorder/[slug].astro`): PageHeader → featured ProductCard → ProductGrid → ThreeColumn (how ordering works) → Prose. Drop page: PageHeader → Countdown + Prose → ProductGallery → PreorderForm
- **Form page** (`src/pages/join.astro`): PageHeader → Section tone=base: Prose intro + the form island (client:visible) → Toast for the result

## Classes and tokens

| Class | Use |
|---|---|
| `bg-ink | bg-ink-900 | bg-ink-800` | Page, alt section, card surfaces |
| `bg-crimson | bg-gold | bg-forest` | FILLS only. Text colours: text-crimson-400, text-gold-300 (AA on dark), text-bone, text-bone-muted |
| `bg-sand | bg-topo | bg-seigaiha` | Text-safe textures (or Section tone=…) |
| `bg-sand-bold | bg-seigaiha-bold` | Decorative textures; never under text |
| `bg-drift (+ bg-drift-reverse)` | Animate any texture above |
| `font-display | font-sans | font-marker` | Headlines | body | brush (logo-like accents only) |
| `eyebrow` | Small caps kicker above a headline |
| `numeral | numeral-ghost` | Gold ribbed digits | ghost jersey number behind a photo |
| `site-frame / site-surround` | BaseLayout only: the 1600px page frame over a dimmed seigaiha surround on wide screens |
| `tap` | 44×44px minimum target on any custom control |
| `field-label | field-input | field-hint` | Raw form controls, matching FormField |

## Catalog

Options: `a|b` lists values, default first. Paths are relative to `src/components/`. Specimens: `/design#<section>`.

### Page scaffolding

- **PageHeader** (`PageHeader.astro`): Opens every interior page. Owns the page h1.
  - Options: title · eyebrow · intro · pattern: sand|topo|seigaiha · images (photo strip)
  - Avoid: On the homepage (use Hero). Never add a second h1 below it.
  - Pairs with: Section
- **Hero** (`Hero.astro`): Homepage / landing-page opener. Owns the page h1.
  - Options: variant: brand|ornate|image|video|text · title · tagline (split on "/") · image+imageAlt · video+poster · animate (drifting sand + swaying terraces on ornate)
  - Avoid: Interior pages (use PageHeader). ornate is the once-per-site showpiece (homepage).
  - Pairs with: ImpactBand, Section
- **Section** (`Section.astro`): Every content band below the header: container, heading block, background.
  - Options: title · eyebrow · kicker · as: h2|h3 · id · tone: base|alt|topo|sand|seigaiha · divider (+dividerSeed)
  - Avoid: Two neighbouring Sections in the same tone; alternate base/alt. Full-bleed blocks (ImpactBand, CtaStrip, showcase Slideshow) go between Sections, not inside.
- **Prose** (`Prose.astro`): Wraps CMS Markdown bodies (<Content />) with typographic defaults.
  - Data: pages collection / any entry body
  - Pairs with: Section
- **TwoColumn** (`TwoColumn.astro`): Boxed image + copy (slot), buttons in slot="actions". A calm break between full-bleed blocks.
  - Options: title · eyebrow · image+imageAlt · imageSide: right|left · as
  - Avoid: Alternating runs of media rows (use FeatureRow).
  - Pairs with: Button
- **ThreeColumn** (`ThreeColumn.astro`): Icon + title + body benefits row (3 items, stacks on phones).
  - Options: items[{icon?, title, body}] · layout: card|centered (bigger, centred; for a row that IS the section) · iconStyle: tile|circle (gold ring, favicon badge) · as

### Content blocks

- **Button** (`Button.astro`): Every button and CTA link. <a> with href, <button> without.
  - Options: variant: primary|outline|gold|ghost|tertiary · size: md|sm|lg · icon (arrow-right default, false) · external · disabled · type
  - Avoid: Hand-rolled <a class="..."> buttons. One primary per view; others outline/ghost.
- **Pill** (`ui/Pill.astro`): Status badge: Open Slot, Pre-Order, Sold Out, Active, Next Up.
  - Options: tone: outline|gold|crimson|forest|muted · size: md|sm
  - Avoid: As a button or link.
- **Callout** (`Callout.astro`): Pull quote / emphasis inside a Section (slot = quote).
  - Options: cite
- **FaqAccordion** (`FaqAccordion.astro`): FAQ list, native <details>, zero JS.
  - Options: items[{question, answer}]
  - Data: faqs collection (sort by order)
- **CtaStrip** (`CtaStrip.astro`): Full-width call-to-action band near the end of a page. Buttons in slot="actions".
  - Options: title · eyebrow · body · tone: crimson|forest · as
  - Pairs with: Button
- **NewsletterBlock** (`NewsletterBlock.astro`): Email sign-up; posts straight to the mailing-list provider (no backend).
  - Options: title · eyebrow · body · as
  - Data: site.yml newsletter settings
  - Avoid: More than once per page.
- **SocialEmbed** (`SocialEmbed.astro`): Third-party social widget slot (Community page).
  - Options: network: instagram|discord|facebook · title
  - Avoid: Adding a new network without allowlisting its origin in public/_headers.

### Marketing & media

- **ImpactBand** (`marketing/ImpactBand.astro`): Full-bleed action photo fading into big copy (manifesto, recruiting push). Buttons in slot="actions".
  - Options: image+imageAlt · title · eyebrow · body · align: left|right · tone: ink|crimson|forest · treatment: fade|duotone · stats[] · ghost (big background word) · focus (object-position) · priority (LCP image) · as. Desktop only: shift -30..30 (% of band, negative = left; slide a centred player out from under the copy) · wash: fade|none (none = photo edge to edge, full colour or tinted) · backdrop: auto|none|scrim|panel (auto = scrim when wash=none). Try combinations in the /design#impactband-playground
  - Avoid: Two ImpactBands back to back; put a boxed block (TwoColumn, Section) between. wash="none" with body text or stats but no backdrop="panel" (scrim alone can fail AA on a bright photo).
  - Pairs with: Hero, TwoColumn
- **FeatureRow** (`marketing/FeatureRow.astro`): Alternating media + copy rows. Flip every other row with reverse.
  - Options: title · body · eyebrow · ctaLabel+ctaHref · image+imageAlt (topo fallback) · reverse
- **PricingCard** (`marketing/PricingCard.astro`): Tier card in a grid (sm:grid-cols-3).
  - Options: tierName · price · unit · bullets[] · ctaLabel+ctaHref · featured (max one per row)
- **ProductGrid** (`marketing/ProductGrid.astro`): Shop grid of ProductCards with optional filter chips.
  - Options: products · categories (same order as products; omit for no chips)
  - Data: products collection
- **ProductCard** (`ProductCard.astro`): Single product teaser linking OUT to the store.
  - Options: product · as
  - Data: products collection entry
- **ProductGallery** (`ProductGallery.tsx`, React island): Pre-order page: main image + thumbnails + full-size modal.
  - Options: images[]
  - Data: preorders collection images
- **GallerySlideshow** (`GallerySlideshow.astro`, Astro + island): Photo carousel from the galleries collection. Use this on pages, not Slideshow directly.
  - Options: layout: peek|single|hero|showcase · indicators: dashes|thumbnails · captionStyle: below|flag · tone: ink|crimson|forest · autoplayMs · emptyTitle/emptyBody
  - Data: galleries collection
  - Avoid: hero/showcase inside a Section (they are full-bleed).
- **Gallery** (`Gallery.astro`): Masonry photo grid, zero JS.
  - Options: images[{src, alt, caption?}]
- **LogoStrip** (`LogoStrip.astro`): Static centred row of 2–6 logos (leagues, partners).
  - Options: items[{name, src?, alt, href?}] (no src → name as text) · label · size: md|sm
  - Avoid: Many sponsors (use SponsorMarquee).
- **SponsorMarquee** (`SponsorMarquee.astro`): Auto-scrolling sponsor strip, once there are enough logos to scroll.
  - Options: sponsors
  - Data: sponsors collection
  - Avoid: Fewer than ~6 sponsors (use LogoStrip). Never invent sponsors.
- **Ticker** (`Ticker.astro`): Slim scrolling news bar: next event, a drop, open roster spots. Full-bleed, under the nav or between sections.
  - Options: items[string|{label, kicker?, href?}] · label (accessible name) · tone: gold|crimson|ink · duration (s) · reverse
  - Data: build items from events/players/preorders at the call site
  - Avoid: More than one per page, above the h1, or in the same view as other motion (incl. an animated hero).

### Events, team & stats

- **EventCard** (`EventCard.astro`): An event with date chip, venue and register/result CTA. Article id = slug (#slug links).
  - Options: event · layout: card|feature (big NEXT UP) · as
  - Data: events collection entry; getEvents() gives upcoming/past/next
- **AgendaList** (`AgendaList.astro`): Compact event list; lighter than cards for 1–2 events.
  - Options: events · next (flags Next Up) · showTbd · linkToCards (#slug rows) · as
  - Data: getEvents()
- **EventsCalendar** (`EventsCalendar.astro`, Astro + island): Month grid; marked days link to EventCards. Opens on the next event month.
  - Options: events · next
  - Data: getEvents()
  - Pairs with: EventCard
- **Countdown** (`Countdown.astro`, Astro + island): Live countdown to an event or drop deadline.
  - Options: target (Date) · passedLabel
- **PlayerCard** (`PlayerCard.astro`): Roster card; open-slot entries render the dashed "join" card.
  - Options: player · href · as
  - Data: players collection entry
- **ProfileCard** (`ProfileCard.astro`): Bio card for non-rostered people (coach, organiser).
  - Options: name · role · image+imageAlt · links[{icon, href, label}] · as
  - Avoid: Rostered players (use PlayerCard).
- **StatNumber** (`StatNumber.astro`): One big gold ribbed figure + label.
  - Options: value · label · size: md|sm|lg
  - Data: computed in src/lib/stats.ts, never typed into content
- **StatStrip** (`StatStrip.astro`): Band of team StatNumbers.
  - Options: stats
  - Data: src/lib/stats.ts (results collection)
  - Avoid: Before real results exist (use MascotCallout).
- **StatLeaderboardTable** (`StatLeaderboardTable.tsx`, React island): Sortable player stats table.
  - Options: rows · roles
  - Data: src/lib/stats.ts
- **TeamStatsWidget** (`TeamStatsWidget.astro`): Live team match cards from pblidb.org (build-time fetch, fails soft).
  - Options: widget
  - Data: src/lib/pblidb.ts

### Forms

- **FormField** (`form/FormField.astro`): Label + input|textarea|select + hint/error. Visible label always.
  - Options: label · name · as: input|textarea|select · type · hint · error · required · disabled · rows
  - Avoid: Raw <input>; if you must, use the .field-* classes.
- **RadioGroup** (`form/RadioGroup.astro`): Single choice from 2–6 options, in a fieldset.
  - Options: legend · name · options[{value, label}] · defaultValue
- **CheckboxGroup** (`form/CheckboxGroup.astro`): Multiple choice, in a fieldset.
  - Options: legend · name · options[{value, label}] · defaultValues
- **CountryCombobox** (`form/CountryCombobox.tsx`, React island): Searchable country picker; pre-fills from browser language; posts one canonical name.
  - Options: id · name · required · defaultCode · detect
- **JoinRequestForm** (`JoinRequestForm.tsx`, React island): The /join "play an event with us" form; posts to Google Forms.
  - Data: site.yml join settings + events
- **PreorderForm** (`PreorderForm.tsx`, React island): Pre-order request form for a drop; posts to Google Forms.
  - Data: preorders collection entry

### Status & feedback

- **MascotCallout** (`MascotCallout.astro`): The honest empty state: no events, no results, no photos yet. Slot = action Buttons.
  - Options: title · body · as
  - Avoid: An empty grid, or invented placeholder content.
- **ImagePlaceholder** (`ImagePlaceholder.astro`): Striped, labelled stand-in where a real photo will go.
  - Options: label (announced; name the shot) · ratio: 4/5|16/9|1/1|3/2|16/10|16/7|4/3 · showRatio
  - Avoid: Stock or AI photos presented as the team.
- **Toast** (`Toast.astro`): Confirms an on-page action (form sent). Toggle hidden from the owning flow.
  - Options: message · tone: success|error · position: inline|fixed · mascot · dismissible · hidden · id

### Brand & motifs

- **Icon** (`brand/Icon.astro`): Every glyph. Decorative unless label is set (icon-only controls).
  - Options: name (src/lib/icons.ts) · label · strokeWidth · class (size-*, text-*)
  - Avoid: Inline SVG copies or icon fonts. New glyph: add its path to src/lib/icons.ts.
- **TerracedDivider** (`brand/TerracedDivider.astro`): Section break / card footer.
  - Options: style: rice-terrace|pagoda|refined-peaks · variant: full|line · flip · seed
  - Pairs with: Section (divider prop)
- **RiceTerraces** (`brand/RiceTerraces.astro`): Layered gold-lined landscape for the foot of a hero. Once per page.
  - Options: seed · simple · flip · animate (swaying depths) · sizing: h-28 sm:h-36 lg:h-auto lg:aspect-[2400/260]
- **RuyiCloud** (`brand/RuyiCloud.astro`): Cloud accent; colour with text-*, 10–20% opacity behind content.
  - Options: variant: 1–6 · flip · outline (+outlineWidth)
  - Avoid: Removing the /credits attribution (licence condition).
- **CloudCorner** (`brand/CloudCorner.astro`): Gilded cloud bank with swaying lanterns for hero corners.
  - Options: side: left|right · lanterns · variants
- **Lantern** (`brand/Lantern.astro`): Hanging lantern ornament.
  - Options: variant: outline|paper · tone: forest|crimson (paper) · sway (+swayDelay) · cord
- **Wordmark** (`brand/Wordmark.astro`): The official brush logo lockup.
  - Options: size: nav|hero|footer · label (only when it IS the link name) · color
  - Avoid: Retyping "The Leftovers" in the brush font as a logo.
- **MascotMark** (`brand/MascotMark.astro`): Takeout-box mascot icon; dim for watermarks.
  - Options: width · dim
- **Badge** (`brand/Badge.astro`): Round team crest.
- **.bg-drift** (`src/styles/global.css`, CSS utility): Add next to any .bg-* texture to drift its tile sideways (hero / PageHeader).
  - Options: .bg-drift-reverse · [--drift-duration:Ns]
  - Avoid: A Ticker or autoplaying slideshow in the same view.

### Site chrome (already in BaseLayout; never add to a page)

`CookieConsent`, `Nav`, `Footer`, `Seo`.

### Internal (never import directly on a page)

`Slideshow.tsx`: The carousel island behind GallerySlideshow. · `ui/carousel.tsx`: shadcn/Embla primitive behind Slideshow. · `Calendar.tsx`: The month-grid island behind EventsCalendar. · `CountdownIsland.tsx`: The ticking island behind Countdown.
