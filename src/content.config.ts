import { defineCollection, reference } from 'astro:content';
import * as z from 'astro/zod';
import { glob, file } from 'astro/loaders';

/* -------------------------------------------------------------------------
 * Content collections (PRD §6).
 *
 * Every file here is plain Markdown/YAML in the repo, authored through the
 * Pages CMS UI (.pages.yml maps 1:1 onto these schemas). There is no
 * database and no backend — a CMS save is a git commit is a deploy.
 *
 * Rule enforced throughout: any image field is paired with a REQUIRED `alt`
 * field. That's both an a11y requirement and an SEO input (§6, §10.3).
 * ---------------------------------------------------------------------- */

/** Media live in src/assets so Astro can optimize them; see lib/images.ts. */
const imagePath = z.string().describe('Repo path, e.g. /src/assets/img/players/22.jpg');

const socials = z
  .object({
    instagram: z.url().optional(),
    tiktok: z.url().optional(),
    youtube: z.url().optional(),
    discord: z.string().optional(),
  })
  .prefault({});

const seo = z
  .object({
    title: z.string().max(70).optional(),
    description: z.string().max(200).optional(),
    ogImage: imagePath.optional(),
    ogImageAlt: z.string().optional(),
    noindex: z.boolean().default(false),
  })
  .prefault({});

const players = defineCollection({
  loader: glob({ base: './src/content/players', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    /** Jersey number — rendered with the gold ribbed numeral treatment. */
    number: z.number().int().min(0).max(99).optional(),
    role: z.string().describe('Sniper / Support / Rush / Back / Insert'),
    photo: imagePath.optional(),
    photoAlt: z.string().optional(),
    socials,
    status: z.enum(['active', 'open-slot']).default('active'),
    joined: z.coerce.date().optional(),
    /** Lower sorts first on the roster; ties fall back to jersey number. */
    order: z.number().default(100),
    featured: z.boolean().default(false),
    seo,
  }),
});

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** PBLeague league/series tag, e.g. "PBLeague D4 Series". */
    league: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    /** Optional: events are often announced before the venue is confirmed. */
    location: z
      .object({
        venue: z.string(),
        city: z.string(),
        mapUrl: z.url().optional(),
      })
      .optional(),
    registrationUrl: z.url().optional(),
    /**
     * Optional manual override. Left empty, upcoming/past is DERIVED from the
     * date so the site can never show a stale "upcoming" event just because
     * nobody edited the flag after a tournament.
     */
    status: z.enum(['upcoming', 'past']).optional(),
    cover: imagePath.optional(),
    coverAlt: z.string().optional(),
    /** Free text, filled in after the event. */
    resultSummary: z.string().optional(),
    placement: z.string().optional().describe('e.g. "2nd of 14"'),
    seo,
  }),
});

const results = defineCollection({
  loader: glob({ base: './src/content/results', pattern: '**/*.{yml,yaml}' }),
  schema: z.object({
    event: reference('events'),
    /** Final team placement at this event. */
    placement: z.number().int().positive().optional(),
    fieldSize: z.number().int().positive().optional().describe('Teams in the bracket'),
    record: z.string().optional().describe('e.g. "4-1"'),
    /**
     * Per-player stat lines, entered by hand after each event (PRD §8.1 —
     * there is no public PBLeague API; a CSV importer is a phase-3 item).
     */
    players: z
      .array(
        z.object({
          player: reference('players'),
          gamesPlayed: z.number().int().min(0).default(0),
          eliminations: z.number().int().min(0).default(0),
          deaths: z.number().int().min(0).default(0),
          flagPulls: z.number().int().min(0).default(0),
          flagHangs: z.number().int().min(0).default(0),
          penalties: z.number().int().min(0).default(0),
        })
      )
      .default([]),
  }),
});

const sponsors = defineCollection({
  loader: glob({ base: './src/content/sponsors', pattern: '**/*.{yml,yaml}' }),
  schema: z.object({
    name: z.string(),
    logo: imagePath.optional(),
    logoAlt: z.string(),
    url: z.url().optional(),
    tier: z.enum(['title', 'gold', 'supporting']).default('supporting'),
  }),
});

const products = defineCollection({
  loader: glob({ base: './src/content/products', pattern: '**/*.{yml,yaml}' }),
  schema: z.object({
    name: z.string(),
    blurb: z.string().optional(),
    image: imagePath.optional(),
    imageAlt: z.string(),
    price: z.number().nonnegative(),
    currency: z.string().default('USD'),
    /** Bonfire / Fourthwall campaign URL. The site never takes payment (§8.2). */
    buyUrl: z.url(),
    status: z.enum(['available', 'pre-order', 'sold-out']).default('available'),
    /** Pre-order batch close date, shown as a countdown on the shop page. */
    preorderCloses: z.coerce.date().optional(),
    order: z.number().default(100),
  }),
});

/**
 * Pre-order campaigns (drops).
 *
 * Deliberately NOT the same thing as `products`. A product is a thing you can
 * go buy; a drop is a time-boxed batch with per-order customisation (jersey
 * version, size, name and number on the back), a deadline, and — increasingly
 * — a cause attached.
 *
 * This exists because the real process was orders collected as comments on a
 * Facebook post. The failure mode there isn't the form-filling, it's that
 * nobody can tell whether their order was counted, what they owe, or whether
 * the drop hit its goal.
 */
const preorders = defineCollection({
  loader: glob({ base: './src/content/preorders', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** Short line under the title, e.g. "Breast Cancer Awareness drop". */
    eyebrow: z.string().optional(),
    status: z.enum(['draft', 'open', 'closed', 'fulfilled']).default('draft'),
    /** The order deadline. Drives the countdown and auto-closes the form. */
    closesAt: z.coerce.date(),

    price: z.number().nonnegative(),
    currency: z.string().default('USD'),
    /** e.g. "shipped anywhere in the US" — rendered next to the price. */
    priceNote: z.string().optional(),

    /** The jersey cuts / colourways on offer. At least one. */
    variants: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          image: imagePath.optional(),
          imageAlt: z.string().optional(),
          /**
           * Only needed when it differs from `name` — e.g. the backing
           * Google Form's multiple-choice option text. Google silently
           * discards a value it doesn't recognise, so this must match the
           * form's option EXACTLY. See docs/PREORDERS.md.
           */
          formValue: z.string().optional(),
        })
      )
      .min(1),

    /**
     * Size labels must match the backing Google Form's option strings
     * EXACTLY — a multiple-choice answer Google doesn't recognise is
     * discarded. See docs/PREORDERS.md.
     */
    sizes: z.array(z.string()).min(1),

    /** Ship vs collect. Labels must likewise match the form's options. */
    deliveryOptions: z.array(z.string()).default([]),

    /** Which per-jersey fields the order form should collect. */
    customisation: z
      .object({
        nameOnBack: z.boolean().default(true),
        numberOnBack: z.boolean().default(true),
      })
      .prefault({}),

    /**
     * Optional cause. `unitsSold` is entered by hand in the CMS — there is no
     * backend counting orders, and a fabricated progress bar would be worse
     * than none. See docs/PREORDERS.md.
     */
    cause: z
      .object({
        name: z.string(),
        url: z.url().optional(),
        donationPerUnit: z.number().nonnegative(),
        goalUnits: z.number().int().positive(),
        unitsSold: z.number().int().min(0).default(0),
      })
      .optional(),

    /** How people actually pay, since payment is arranged off-site. */
    paymentMethods: z
      .array(z.object({ label: z.string(), handle: z.string().optional() }))
      .default([]),

    seo,
  }),
});

const pagesCollection = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** Optional kicker shown above the page title. */
    eyebrow: z.string().optional(),
    intro: z.string().optional(),
    /**
     * Every page opens with a hero header (Oct 2026 follow-up to the
     * design-handoff audit). Zero images falls back to the existing styled
     * motif header (topo texture + ruyi cloud) — a page never has to wait on
     * photography to look finished. One image is a static backdrop; more
     * than one cross-fades between them on a slow loop (pure CSS, no JS —
     * same technique as the sponsor marquee) — the "swappable" part is that
     * an editor can add or reorder photos in the CMS without touching code.
     */
    heroImages: z
      .array(
        z.object({
          image: imagePath,
          /** Decorative by default (the <h1> already says what the page is
           *  about) — fill in real alt text only if a photo carries content
           *  the heading doesn't. */
          alt: z.string().default(''),
        })
      )
      .default([]),
    seo,
  }),
});

/**
 * Photo galleries — one file per set (an event, a season, a jersey drop).
 * Feeds the Slideshow component. Not in PRD §6: added because a free-agent
 * team's best recruiting asset is photos of people playing, and §7's gallery
 * component needed somewhere to get them from.
 */
const galleries = defineCollection({
  loader: glob({ base: './src/content/galleries', pattern: '**/*.{yml,yaml}' }),
  schema: z.object({
    title: z.string(),
    /** Optional link back to the event these were shot at. */
    event: reference('events').optional(),
    order: z.number().default(100),
    photos: z
      .array(
        z.object({
          image: imagePath,
          /** Required, as everywhere else an image appears (§6). */
          alt: z.string(),
          /** The slide's own line: the headline in the showcase slider, the flag text elsewhere. */
          caption: z.string().optional(),
          /** Small context line above the caption. Defaults to the gallery title. */
          kicker: z.string().optional(),
        })
      )
      .default([]),
  }),
});

const faqs = defineCollection({
  loader: file('./src/content/faqs.yml'),
  schema: z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
    order: z.number().default(100),
  }),
});

/**
 * Landing pages: the page builder (Nov 2026).
 *
 * A landing page is a fixed `hero` plus an ordered list of `sections`, picked
 * and dragged into order in Pages CMS (`type: block` in .pages.yml). Each
 * block's `type` selects an existing component in BlockRenderer.astro, so
 * editors compose pages but can't invent styling.
 *
 * The hero is deliberately NOT a block. Fixing it to the top guarantees the
 * one-h1 rule and keeps React islands (the gallery block) below the fold.
 *
 * `optText` accepts null and '' because a form can save an untouched optional
 * field either way; both mean "not set". Buttons are a list for the same
 * reason: an empty list is no button, never a half-filled one.
 */
const optText = z
  .string()
  .nullish()
  .transform((value) => value || undefined);

const optList = <T extends z.ZodType>(item: T) =>
  z
    .array(item)
    .nullish()
    .transform((value) => value ?? []);

const ctas = optList(
  z.object({
    label: z.string(),
    href: z.string(),
    variant: z.enum(['primary', 'outline', 'gold', 'ghost']).default('primary'),
  })
);

const sectionTone = z.enum(['base', 'alt', 'topo', 'sand', 'seigaiha']).default('base');

const landingBlock = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('impactBand'),
    image: imagePath,
    imageAlt: z.string().min(1),
    eyebrow: optText,
    title: z.string(),
    body: optText,
    stats: optList(z.object({ value: z.string(), label: z.string() })),
    ghost: optText,
    align: z.enum(['left', 'right']).default('left'),
    tone: z.enum(['ink', 'crimson', 'forest']).default('ink'),
    treatment: z.enum(['fade', 'duotone']).default('fade'),
    wash: z.enum(['fade', 'none']).default('fade'),
    backdrop: z.enum(['auto', 'none', 'scrim', 'panel']).default('auto'),
    shift: z.number().min(-30).max(30).nullish(),
    focus: optText,
    ctas,
  }),
  z.object({
    type: z.literal('statement'),
    eyebrow: optText,
    lines: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('gallery'),
    /** A `galleries` entry. A string, not reference(): see BlockRenderer. */
    gallery: z.string(),
    layout: z.enum(['showcase', 'hero', 'peek', 'single']).default('showcase'),
  }),
  z.object({
    type: z.literal('twoColumn'),
    tone: sectionTone,
    eyebrow: optText,
    title: z.string(),
    image: imagePath.nullish(),
    imageAlt: z.string().min(1),
    imageSide: z.enum(['left', 'right']).default('right'),
    body: optText,
    /** Numbered steps: a bold lead-in, then the sentence. */
    steps: optList(z.object({ lead: z.string(), text: z.string() })),
    ctas,
  }),
  z.object({
    type: z.literal('announcement'),
    tone: sectionTone,
    eyebrow: optText,
    title: optText,
    heading: z.string(),
    body: optText,
    ctas,
    /** Adds the leagues logo row from Site settings. */
    showLeagues: z.boolean().default(false),
    leaguesLabel: optText,
  }),
  z.object({
    type: z.literal('threeColumn'),
    tone: sectionTone,
    eyebrow: optText,
    title: optText,
    layout: z.enum(['card', 'centered']).default('card'),
    items: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
  }),
  z.object({
    type: z.literal('featureRow'),
    eyebrow: optText,
    title: z.string(),
    body: z.string(),
    image: imagePath.nullish(),
    imageAlt: z.string().min(1),
    reverse: z.boolean().default(false),
    ctaLabel: optText,
    ctaHref: optText,
  }),
  z.object({
    type: z.literal('prose'),
    tone: sectionTone,
    eyebrow: optText,
    title: optText,
    /** Plain text. A blank line starts a new paragraph. */
    body: z.string(),
  }),
  z.object({
    type: z.literal('ctaStrip'),
    tone: z.enum(['crimson', 'forest']).default('crimson'),
    eyebrow: optText,
    title: z.string(),
    body: optText,
    ctas,
  }),
  z.object({
    type: z.literal('newsletter'),
    tone: sectionTone,
    eyebrow: optText,
    title: optText,
    body: optText,
  }),
  z.object({
    type: z.literal('faq'),
    tone: sectionTone,
    eyebrow: optText,
    title: optText,
  }),
]);

const landing = defineCollection({
  loader: glob({ base: './src/content/landing', pattern: '**/*.{yml,yaml}' }),
  schema: z.object({
    title: z.string(),
    /** Drafts build at /preview/<slug>, noindexed. Published: /<slug>. */
    status: z.enum(['draft', 'published']).default('draft'),
    hero: z
      .object({
        variant: z.enum(['brand', 'ornate', 'image', 'text']).default('brand'),
        title: optText,
        tagline: optText,
        image: imagePath.nullish(),
        imageAlt: optText,
        animate: z.boolean().default(false),
        ctas,
      })
      .refine((hero) => hero.variant !== 'image' || (hero.image && hero.imageAlt), {
        message: 'A photo hero needs both an image and its alt text.',
      }),
    sections: z.array(landingBlock).default([]),
    seo,
  }),
});

export const collections = {
  landing,
  players,
  events,
  results,
  sponsors,
  products,
  preorders,
  pages: pagesCollection,
  galleries,
  faqs,
};
