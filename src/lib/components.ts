/**
 * The component catalog: every component, how to choose it, and how to
 * compose pages from them. One source, three readers:
 *
 *  - the /design page's Component index table renders from `catalog`;
 *  - `docs/COMPONENTS.md` is GENERATED from this file
 *    (`npm run docs:components`). It's the compact brief AI agents read
 *    before building a page, instead of the 1,000-line /design source;
 *  - `npm run build` fails if a component file has no entry here, or if
 *    COMPONENTS.md is stale (scripts/components-doc.ts --check).
 *
 * Keep entries terse: they cost tokens every time an agent reads the doc.
 * `options` lists the props that change what renders, `|` between values,
 * default first. No imports: the generator runs this file with plain Node.
 */

export type Kind = 'Astro' | 'React island' | 'Astro + island' | 'CSS utility';

/** Doc headings, in order. */
export const groups = {
  layout: 'Page scaffolding',
  content: 'Content blocks',
  marketing: 'Marketing & media',
  events: 'Events, team & stats',
  forms: 'Forms',
  feedback: 'Status & feedback',
  brand: 'Brand & motifs',
  site: 'Site chrome (already in BaseLayout; never add to a page)',
} as const;
export type Group = keyof typeof groups;

export interface CatalogEntry {
  name: string;
  /** Path relative to src/components/ (or the repo for CSS utilities). */
  file: string;
  kind: Kind;
  group: Group;
  /** Anchor of its specimen section on /design. */
  section: string;
  /** Has a *.stories.tsx with play tests. */
  story?: boolean;
  /** When to reach for it. */
  use: string;
  /** Props that change the output. Values `a|b`, default first. */
  options?: string;
  /** Where its data comes from. */
  data?: string;
  /** When NOT to use it, or what to use instead. */
  avoid?: string;
  /** Components it's usually composed with. */
  pairs?: string[];
  /** Implementation detail of another entry: listed, not offered for pages. */
  internal?: boolean;
}

export const catalog: CatalogEntry[] = [
  // ---------------------------------------------------------------- layout
  {
    name: 'PageHeader', file: 'PageHeader.astro', kind: 'Astro', group: 'layout', section: 'blocks',
    use: 'Opens every interior page. Owns the page h1.',
    options: 'title · eyebrow · intro · pattern: sand|topo|seigaiha · images (photo strip)',
    avoid: 'On the homepage (use Hero). Never add a second h1 below it.',
    pairs: ['Section'],
  },
  {
    name: 'Hero', file: 'Hero.astro', kind: 'Astro', group: 'layout', section: 'blocks',
    use: 'Homepage / landing-page opener. Owns the page h1.',
    options: 'variant: brand|ornate|image|video|text · title · tagline (split on "/") · image+imageAlt · video+poster · animate (drifting sand + swaying terraces on ornate)',
    avoid: 'Interior pages (use PageHeader). ornate is the once-per-site showpiece (homepage).',
    pairs: ['ImpactBand', 'Section'],
  },
  {
    name: 'Section', file: 'Section.astro', kind: 'Astro', group: 'layout', section: 'blocks',
    use: 'Every content band below the header: container, heading block, background.',
    options: 'title · eyebrow · kicker · as: h2|h3 · id · tone: base|alt|topo|sand|seigaiha · divider (+dividerSeed)',
    avoid: 'Two neighbouring Sections in the same tone; alternate base/alt. Full-bleed blocks (ImpactBand, CtaStrip, showcase Slideshow) go between Sections, not inside.',
  },
  {
    name: 'Prose', file: 'Prose.astro', kind: 'Astro', group: 'layout', section: 'blocks',
    use: 'Wraps CMS Markdown bodies (<Content />) with typographic defaults.',
    data: 'pages collection / any entry body',
    pairs: ['Section'],
  },
  {
    name: 'TwoColumn', file: 'TwoColumn.astro', kind: 'Astro', group: 'layout', section: 'blocks',
    use: 'Boxed image + copy (slot), buttons in slot="actions". A calm break between full-bleed blocks.',
    options: 'title · eyebrow · image+imageAlt · imageSide: right|left · as',
    avoid: 'Alternating runs of media rows (use FeatureRow).',
    pairs: ['Button'],
  },
  {
    name: 'ThreeColumn', file: 'ThreeColumn.astro', kind: 'Astro', group: 'layout', section: 'blocks',
    use: 'Icon + title + body benefits row (3 items, stacks on phones).',
    options: 'items[{icon?, title, body}] · layout: card|centered (bigger, centred; for a row that IS the section) · iconStyle: tile|circle (gold ring, favicon badge) · as',
  },

  // --------------------------------------------------------------- content
  {
    name: 'Button', file: 'Button.astro', kind: 'Astro', group: 'content', section: 'components',
    use: 'Every button and CTA link. <a> with href, <button> without.',
    options: 'variant: primary|outline|gold|ghost|tertiary · size: md|sm|lg · icon (arrow-right default, false) · external · disabled · type',
    avoid: 'Hand-rolled <a class="..."> buttons. One primary per view; others outline/ghost.',
  },
  {
    name: 'Pill', file: 'ui/Pill.astro', kind: 'Astro', group: 'content', section: 'components',
    use: 'Status badge: Open Slot, Pre-Order, Sold Out, Active, Next Up.',
    options: 'tone: outline|gold|crimson|forest|muted · size: md|sm',
    avoid: 'As a button or link.',
  },
  {
    name: 'Callout', file: 'Callout.astro', kind: 'Astro', group: 'content', section: 'blocks',
    use: 'Pull quote / emphasis inside a Section (slot = quote).',
    options: 'cite',
  },
  {
    name: 'FaqAccordion', file: 'FaqAccordion.astro', kind: 'Astro', group: 'content', section: 'blocks',
    use: 'FAQ list, native <details>, zero JS.',
    options: 'items[{question, answer}]',
    data: 'faqs collection (sort by order)',
  },
  {
    name: 'BlockRenderer', file: 'BlockRenderer.astro', kind: 'Astro', group: 'layout', section: 'marketing',
    use: 'Renders a landing entry: fixed Hero, then the blocks the team stacked in Pages CMS. Used by src/pages/[slug].astro and preview/[slug].astro.',
    options: 'hero (omit only on /design) · sections[]. Blocks: impactBand, statement, divider, gallery, twoColumn, announcement, threeColumn, featureRow, prose, ctaStrip, newsletter, faq',
    data: 'landing collection (src/content/landing/*.yml). A new block needs src/content.config.ts, .pages.yml and a case here.',
    avoid: 'Pages that need logic or computed data; hand-write those.',
    pairs: ['Hero', 'ImpactBand', 'TwoColumn'],
  },
  {
    name: 'CtaStrip', file: 'CtaStrip.astro', kind: 'Astro', group: 'content', section: 'blocks',
    use: 'Full-width call-to-action band near the end of a page. Buttons in slot="actions".',
    options: 'title · eyebrow · body · tone: crimson|forest · as',
    pairs: ['Button'],
  },
  {
    name: 'NewsletterBlock', file: 'NewsletterBlock.astro', kind: 'Astro', group: 'content', section: 'blocks',
    use: 'Email sign-up; posts straight to the mailing-list provider (no backend).',
    options: 'title · eyebrow · body · as',
    data: 'site.yml newsletter settings',
    avoid: 'More than once per page.',
  },
  {
    name: 'SocialEmbed', file: 'SocialEmbed.astro', kind: 'Astro', group: 'content', section: 'blocks',
    use: 'Third-party social widget slot (Community page).',
    options: 'network: instagram|discord|facebook · title',
    avoid: 'Adding a new network without allowlisting its origin in public/_headers.',
  },

  // ------------------------------------------------------------- marketing
  {
    name: 'ImpactBand', file: 'marketing/ImpactBand.astro', kind: 'Astro', group: 'marketing', section: 'marketing',
    use: 'Full-bleed action photo fading into big copy (manifesto, recruiting push). Buttons in slot="actions".',
    options: 'image+imageAlt · title · eyebrow · body · align: left|right · tone: ink|crimson|forest · treatment: fade|duotone · stats[] · ghost (big background word) · focus (object-position) · priority (LCP image) · as. Desktop only: shift -30..30 (% of band, negative = left; slide a centred player out from under the copy) · wash: fade|none (none = photo edge to edge, full colour or tinted) · backdrop: auto|none|scrim|panel (auto = scrim when wash=none). Try combinations in the /design#impactband-playground',
    avoid: 'Two ImpactBands back to back; put a boxed block (TwoColumn, Section) between. wash="none" with body text or stats but no backdrop="panel" (scrim alone can fail AA on a bright photo).',
    pairs: ['Hero', 'TwoColumn'],
  },
  {
    name: 'FeatureRow', file: 'marketing/FeatureRow.astro', kind: 'Astro', group: 'marketing', section: 'marketing',
    use: 'Alternating media + copy rows. Flip every other row with reverse.',
    options: 'title · body · eyebrow · ctaLabel+ctaHref · image+imageAlt (topo fallback) · reverse',
  },
  {
    name: 'PricingCard', file: 'marketing/PricingCard.astro', kind: 'Astro', group: 'marketing', section: 'marketing',
    use: 'Tier card in a grid (sm:grid-cols-3).',
    options: 'tierName · price · unit · bullets[] · ctaLabel+ctaHref · featured (max one per row)',
  },
  {
    name: 'ProductGrid', file: 'marketing/ProductGrid.astro', kind: 'Astro', group: 'marketing', section: 'marketing',
    use: 'Shop grid of ProductCards with optional filter chips.',
    options: 'products · categories (same order as products; omit for no chips)',
    data: 'products collection',
  },
  {
    name: 'ProductCard', file: 'ProductCard.astro', kind: 'Astro', group: 'marketing', section: 'marketing',
    use: 'Single product teaser linking OUT to the store.',
    options: 'product · as', data: 'products collection entry',
  },
  {
    name: 'ProductGallery', file: 'ProductGallery.tsx', kind: 'React island', group: 'marketing', section: 'marketing',
    use: 'Pre-order page: main image + thumbnails + full-size modal.',
    options: 'images[]', data: 'preorders collection images',
  },
  {
    name: 'GallerySlideshow', file: 'GallerySlideshow.astro', kind: 'Astro + island', group: 'marketing', section: 'marketing', story: true,
    use: 'Photo carousel from the galleries collection. Use this on pages, not Slideshow directly.',
    options: 'layout: peek|single|hero|showcase · indicators: dashes|thumbnails|grid (paged, lazy, opens a lightbox; with single) · pageSize (grid, default 8) · captionStyle: below|flag · tone: ink|crimson|forest · autoplayMs · emptyTitle/emptyBody',
    data: 'galleries collection',
    avoid: 'hero/showcase inside a Section (they are full-bleed).',
  },
  {
    name: 'Slideshow', file: 'Slideshow.tsx', kind: 'React island', group: 'marketing', section: 'marketing', story: true, internal: true,
    use: 'The carousel island behind GallerySlideshow.',
  },
  {
    name: 'Lightbox', file: 'Lightbox.tsx', kind: 'React island', group: 'marketing', section: 'marketing', story: true, internal: true,
    use: 'Full-screen viewer with magnifier, opened from Slideshow indicators="grid".',
  },
  {
    name: 'Carousel primitive', file: 'ui/carousel.tsx', kind: 'React island', group: 'marketing', section: 'marketing', internal: true,
    use: 'shadcn/Embla primitive behind Slideshow.',
  },
  {
    name: 'Gallery', file: 'Gallery.astro', kind: 'Astro', group: 'marketing', section: 'marketing',
    use: 'Masonry photo grid, zero JS.',
    options: 'images[{src, alt, caption?}]',
  },
  {
    name: 'LogoStrip', file: 'LogoStrip.astro', kind: 'Astro', group: 'marketing', section: 'marketing',
    use: 'Static centred row of 2–6 logos (leagues, partners).',
    options: 'items[{name, src?, alt, href?}] (no src → name as text) · label · size: md|sm',
    avoid: 'Many sponsors (use SponsorMarquee).',
  },
  {
    name: 'SponsorMarquee', file: 'SponsorMarquee.astro', kind: 'Astro', group: 'marketing', section: 'marketing',
    use: 'Auto-scrolling sponsor strip, once there are enough logos to scroll.',
    options: 'sponsors', data: 'sponsors collection',
    avoid: 'Fewer than ~6 sponsors (use LogoStrip). Never invent sponsors.',
  },
  {
    name: 'Ticker', file: 'Ticker.astro', kind: 'Astro', group: 'marketing', section: 'motion',
    use: 'Slim scrolling news bar: next event, a drop, open roster spots. Full-bleed, under the nav or between sections.',
    options: 'items[string|{label, kicker?, href?}] · label (accessible name) · tone: gold|crimson|ink · duration (s) · reverse',
    data: 'build items from events/players/preorders at the call site',
    avoid: 'More than one per page, above the h1, or in the same view as other motion (incl. an animated hero).',
  },

  // ---------------------------------------------------------------- events
  {
    name: 'EventCard', file: 'EventCard.astro', kind: 'Astro', group: 'events', section: 'components',
    use: 'An event with date chip and venue. Upcoming: Request a spot (to /join) until the event ends or closedToRequests is ticked. Past: best finish and all squads. Article id = slug (#slug links).',
    options: 'event · layout: card|feature (big NEXT UP, full address) · as',
    data: 'events collection entry; getEvents() gives upcoming/past/next',
  },
  {
    name: 'SeasonStrip', file: 'SeasonStrip.astro', kind: 'Astro', group: 'events', section: 'calendar',
    use: 'A whole season on one line: 12 months, events linked to their #slug cards. The default schedule view.',
    options: 'events · year', data: 'getEvents().all',
    pairs: ['EventCard'],
  },
  {
    name: 'ProcessSteps', file: 'ProcessSteps.astro', kind: 'Astro', group: 'events', section: 'calendar',
    use: 'Numbered how-it-works steps, e.g. how a player gets onto a squad.',
    options: 'steps[{title, body}] · layout: row|stack · as', data: 'site.eventProcess.steps',
  },
  {
    name: 'EventFees', file: 'EventFees.astro', kind: 'Astro', group: 'events', section: 'calendar',
    use: 'League fees per team as format × division × deadline.',
    options: 'event · note', data: 'event.data.fees + feeDeadlines; site.eventProcess.feeNote',
    avoid: 'Per-player figures: the captain confirms each player\'s fee.',
  },
  {
    name: 'EventSquads', file: 'EventSquads.astro', kind: 'Astro', group: 'events', section: 'calendar',
    use: 'Every squad at an event by division, with final places once results are in.',
    options: 'squads · columns: 1|2', data: 'event.data.squads',
  },
  {
    name: 'AgendaList', file: 'AgendaList.astro', kind: 'Astro', group: 'events', section: 'calendar',
    use: 'Compact event list; lighter than cards for 1–2 events.',
    options: 'events · next (flags Next Up) · showTbd · linkToCards (#slug rows) · as',
    data: 'getEvents()',
  },
  {
    name: 'EventsCalendar', file: 'EventsCalendar.astro', kind: 'Astro + island', group: 'events', section: 'calendar', story: true,
    use: 'Month grid; marked days link to EventCards. Opens on the next event month.',
    options: 'events · next', data: 'getEvents()',
    avoid: 'The team\'s schedule: about one event a month leaves it mostly empty. Use SeasonStrip.',
    pairs: ['EventCard'],
  },
  {
    name: 'Calendar', file: 'Calendar.tsx', kind: 'React island', group: 'events', section: 'calendar', story: true, internal: true,
    use: 'The month-grid island behind EventsCalendar.',
  },
  {
    name: 'Countdown', file: 'Countdown.astro', kind: 'Astro + island', group: 'events', section: 'components',
    use: 'Live countdown to an event or drop deadline.',
    options: 'target (Date) · passedLabel',
  },
  {
    name: 'CountdownIsland', file: 'CountdownIsland.tsx', kind: 'React island', group: 'events', section: 'components', internal: true,
    use: 'The ticking island behind Countdown.',
  },
  {
    name: 'ProfileCard', file: 'ProfileCard.astro', kind: 'Astro', group: 'events', section: 'components',
    use: 'Bio card for the people who run the team. Bio in the default slot.',
    options: 'name · role · image+imageAlt · links[{icon, href, label}] · as',
    data: 'team collection entry',
  },
  {
    name: 'StatNumber', file: 'StatNumber.astro', kind: 'Astro', group: 'events', section: 'components',
    use: 'One big gold ribbed figure + label.',
    options: 'value · label · size: md|sm|lg',
    data: 'computed from collections, never typed into content',
  },
  {
    name: 'TeamStatsWidget', file: 'TeamStatsWidget.astro', kind: 'Astro', group: 'events', section: 'marketing',
    use: 'A squad record from pblidb.org (build-time fetch, fails soft). Show ATTRIBUTION with it.',
    options: 'widget · as', data: 'getTeamWidgets() in src/lib/pblidb.ts',
  },

  // ----------------------------------------------------------------- forms
  {
    name: 'FormField', file: 'form/FormField.astro', kind: 'Astro', group: 'forms', section: 'forms',
    use: 'Label + input|textarea|select + hint/error. Visible label always.',
    options: 'label · name · as: input|textarea|select · type · hint · error · required · disabled · rows',
    avoid: 'Raw <input>; if you must, use the .field-* classes.',
  },
  {
    name: 'RadioGroup', file: 'form/RadioGroup.astro', kind: 'Astro', group: 'forms', section: 'forms',
    use: 'Single choice from 2–6 options, in a fieldset.',
    options: 'legend · name · options[{value, label}] · defaultValue',
  },
  {
    name: 'CheckboxGroup', file: 'form/CheckboxGroup.astro', kind: 'Astro', group: 'forms', section: 'forms',
    use: 'Multiple choice, in a fieldset.',
    options: 'legend · name · options[{value, label}] · defaultValues',
  },
  {
    name: 'CountryCombobox', file: 'form/CountryCombobox.tsx', kind: 'React island', group: 'forms', section: 'forms', story: true,
    use: 'Searchable country picker; pre-fills from browser language; posts one canonical name.',
    options: 'id · name · required · defaultCode · detect',
  },
  {
    name: 'JoinRequestForm', file: 'JoinRequestForm.tsx', kind: 'React island', group: 'forms', section: 'forms', story: true,
    use: 'The /join "play an event with us" form; posts to Google Forms.',
    data: 'site.yml join settings + events',
  },
  {
    name: 'PreorderForm', file: 'PreorderForm.tsx', kind: 'React island', group: 'forms', section: 'forms', story: true,
    use: 'Pre-order request form for a drop; posts to Google Forms.',
    data: 'preorders collection entry',
  },

  // -------------------------------------------------------------- feedback
  {
    name: 'MascotCallout', file: 'MascotCallout.astro', kind: 'Astro', group: 'feedback', section: 'blocks',
    use: 'The honest empty state: no events, no results, no photos yet. Slot = action Buttons.',
    options: 'title · body · as',
    avoid: 'An empty grid, or invented placeholder content.',
  },
  {
    name: 'ImagePlaceholder', file: 'ImagePlaceholder.astro', kind: 'Astro', group: 'feedback', section: 'imagery',
    use: 'Striped, labelled stand-in where a real photo will go.',
    options: 'label (announced; name the shot) · ratio: 4/5|16/9|1/1|3/2|16/10|16/7|4/3 · showRatio',
    avoid: 'Stock or AI photos presented as the team.',
  },
  {
    name: 'Toast', file: 'Toast.astro', kind: 'Astro', group: 'feedback', section: 'components',
    use: 'Confirms an on-page action (form sent). Toggle hidden from the owning flow.',
    options: 'message · tone: success|error · position: inline|fixed · mascot · dismissible · hidden · id',
  },
  {
    name: 'CookieConsent', file: 'CookieConsent.tsx', kind: 'React island', group: 'site', section: 'components', story: true,
    use: 'Analytics consent banner. Rendered once by BaseLayout.',
  },

  // ----------------------------------------------------------------- brand
  {
    name: 'Icon', file: 'brand/Icon.astro', kind: 'Astro', group: 'brand', section: 'icons',
    use: 'Every glyph. Decorative unless label is set (icon-only controls).',
    options: 'name (src/lib/icons.ts) · label · strokeWidth · class (size-*, text-*)',
    avoid: 'Inline SVG copies or icon fonts. New glyph: add its path to src/lib/icons.ts.',
  },
  {
    name: 'BrandRule', file: 'brand/BrandRule.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'Themed horizontal rule: splits content inside a section and adds air between stacked components.',
    options: 'ornament: peaks|field|cloud · spacing: none|sm|md|lg',
    avoid: 'Between two Sections with different tones: the tone change already separates them.',
  },
  {
    name: 'TerracedDivider', file: 'brand/TerracedDivider.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'Section break / card footer.',
    options: 'style: rice-terrace|pagoda|refined-peaks · variant: full|line · flip · seed',
    pairs: ['Section (divider prop)'],
  },
  {
    name: 'RiceTerraces', file: 'brand/RiceTerraces.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'Layered gold-lined landscape for the foot of a hero. Once per page.',
    options: 'seed · simple · flip · animate (swaying depths) · sizing: h-28 sm:h-36 lg:h-auto lg:aspect-[2400/260]',
  },
  {
    name: 'RuyiCloud', file: 'brand/RuyiCloud.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'Cloud accent; colour with text-*, 10–20% opacity behind content.',
    options: 'variant: 1–6 · flip · outline (+outlineWidth)',
    avoid: 'Removing the /credits attribution (licence condition).',
  },
  {
    name: 'CloudCorner', file: 'brand/CloudCorner.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'Gilded cloud bank with swaying lanterns for hero corners.',
    options: 'side: left|right · lanterns · variants',
  },
  {
    name: 'Lantern', file: 'brand/Lantern.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'Hanging lantern ornament.',
    options: 'variant: outline|paper · tone: forest|crimson (paper) · sway (+swayDelay) · cord',
  },
  {
    name: 'Wordmark', file: 'brand/Wordmark.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'The official brush logo lockup.',
    options: 'size: nav|hero|footer · label (only when it IS the link name) · color',
    avoid: 'Retyping "The Leftovers" in the brush font as a logo.',
  },
  {
    name: 'MascotMark', file: 'brand/MascotMark.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'Takeout-box mascot icon; dim for watermarks.',
    options: 'width · dim',
  },
  {
    name: 'Badge', file: 'brand/Badge.astro', kind: 'Astro', group: 'brand', section: 'motifs',
    use: 'Round team crest.',
  },
  {
    name: '.bg-drift', file: 'src/styles/global.css', kind: 'CSS utility', group: 'brand', section: 'motion',
    use: 'Add next to any .bg-* texture to drift its tile sideways (hero / PageHeader).',
    options: '.bg-drift-reverse · [--drift-duration:Ns]',
    avoid: 'A Ticker or autoplaying slideshow in the same view.',
  },

  // ------------------------------------------------------------------ site
  { name: 'Nav', file: 'Nav.astro', kind: 'Astro', group: 'site', section: 'index', use: 'Site navigation. Rendered by BaseLayout.' },
  { name: 'SponsorBand', file: 'SponsorBand.astro', kind: 'Astro', group: 'site', section: 'marketing', use: 'Sponsors row above the footer. Rendered by BaseLayout.', data: 'sponsors collection' },
  { name: 'Footer', file: 'Footer.astro', kind: 'Astro', group: 'site', section: 'index', use: 'Site footer. Rendered by BaseLayout.' },
  { name: 'Seo', file: 'Seo.astro', kind: 'Astro', group: 'site', section: 'index', use: 'Head metadata. Pass title/description/noindex/schema to BaseLayout instead.' },
];

/** Page recipes: tried compositions, from the real pages. Top to bottom. */
export const recipes: { name: string; example: string; steps: string }[] = [
  {
    name: 'Interior page (default)',
    example: 'src/pages/contact.astro',
    steps: 'PageHeader (pattern sand) → Section tone=base → Section tone=alt → … alternate → CtaStrip or a closing Section with Buttons',
  },
  {
    name: 'Homepage / landing',
    example: 'src/pages/index.astro',
    steps: 'Hero variant=ornate animate (+RiceTerraces) → ImpactBand → GallerySlideshow layout=showcase → TwoColumn (boxed break) → ImpactBand tone=crimson → Section tone=seigaiha + LogoStrip → NewsletterBlock',
  },
  {
    name: 'Long-form / legal (Markdown body)',
    example: 'src/pages/privacy.astro',
    steps: 'PageHeader → Section tone=base > Prose > <Content /> → Buttons (outline + ghost)',
  },
  {
    name: 'Schedule',
    example: 'src/pages/events.astro',
    steps: 'PageHeader → Section tone=alt: Countdown + EventCard layout=feature + EventSquads (next), or MascotCallout when empty → Section: ProcessSteps + BrandRule + EventFees → Section tone=alt: per year, SeasonStrip + past EventCards (older years in <details>)',
  },
  {
    name: 'Shop / product',
    example: 'src/pages/shop.astro, src/pages/preorder/[slug].astro',
    steps: 'PageHeader → featured ProductCard → ProductGrid → ThreeColumn (how ordering works) → Prose. Drop page: PageHeader → Countdown + Prose → ProductGallery → PreorderForm',
  },
  {
    name: 'Form page',
    example: 'src/pages/join.astro',
    steps: 'PageHeader → Section tone=base: Prose intro + the form island (client:visible) → Toast for the result',
  },
];

/** Shared classes from src/styles/global.css (and @theme tokens). */
export const utilities: { cls: string; use: string }[] = [
  { cls: 'bg-ink | bg-ink-900 | bg-ink-800', use: 'Page, alt section, card surfaces' },
  { cls: 'bg-crimson | bg-gold | bg-forest', use: 'FILLS only. Text colours: text-crimson-400, text-gold-300 (AA on dark), text-bone, text-bone-muted' },
  { cls: 'bg-sand | bg-topo | bg-seigaiha', use: 'Text-safe textures (or Section tone=…)' },
  { cls: 'bg-sand-bold | bg-seigaiha-bold', use: 'Decorative textures; never under text' },
  { cls: 'bg-drift (+ bg-drift-reverse)', use: 'Animate any texture above' },
  { cls: 'font-display | font-sans | font-marker', use: 'Headlines | body | brush (logo-like accents only)' },
  { cls: 'title-sm', use: 'Any heading under 24px (add text-* to resize): Inter bold, because the headline font fills in when small' },
  { cls: 'eyebrow', use: 'Small caps kicker above a headline' },
  { cls: 'numeral | numeral-ghost', use: 'Gold ribbed digits | ghost jersey number behind a photo' },
  { cls: 'site-frame / site-surround', use: 'BaseLayout only: the 1600px page frame over a dimmed seigaiha surround on wide screens' },
  { cls: 'tap', use: '44×44px minimum target on any custom control' },
  { cls: 'field-label | field-input | field-hint', use: 'Raw form controls, matching FormField' },
];

/** Rules an agent must not break when composing pages. */
export const rules: string[] = [
  'One h1 per page, owned by PageHeader or Hero. Cards and blocks take an `as` heading prop: pass the right level.',
  'Copy comes from collections or src/data/site.yml, not hardcoded in the page. Missing content → MascotCallout / ImagePlaceholder, never invented content.',
  'Tokens only, never raw hex. Images from src/assets/img via <Image>/getImage (CSP: img-src self).',
  'Islands hydrate client:visible and never above the fold.',
  'Full-bleed means the page frame (max 1600px, src/lib/layout.ts), not the screen: use FULL_BLEED_SIZES for a full-width image, never sizes="100vw", and never 100vw/w-screen in CSS.',
  'Full-bleed blocks (ImpactBand, CtaStrip, Ticker, GallerySlideshow hero/showcase) sit between Sections; never two full-bleed photo blocks in a row.',
  'Motion stays ambient: drifting sand, swaying terraces and lanterns may share a hero, but never put a Ticker or an autoplaying slideshow in the same view as other motion.',
];
