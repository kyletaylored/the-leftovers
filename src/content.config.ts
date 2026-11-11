import { defineCollection } from 'astro:content';
import * as z from 'astro/zod';
import { glob, file } from 'astro/loaders';
import { POST_CATEGORY_IDS } from './lib/post-categories';
import { strokedIconNames } from './lib/icons';

type StrokedIcon = (typeof strokedIconNames)[number];

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
    facebook: z.url().optional(),
    tiktok: z.url().optional(),
    youtube: z.url().optional(),
    website: z.url().optional(),
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

/**
 * The people who run The Leftovers: a plain bio, not a roster. Players rotate
 * event by event, so they aren't listed here (see the squads on each event).
 */
const team = defineCollection({
  loader: glob({ base: './src/content/team', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    role: z.string().describe('e.g. "Organizer"'),
    photo: imagePath.optional(),
    photoAlt: z.string().optional(),
    /** Public: it's shown on the site and sits in a public repo. */
    email: z.email().optional(),
    socials,
    /** Lower sorts first. */
    order: z.number().default(100),
    /** Keeps the entry, but leaves it off the site. */
    hidden: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** League/series tag, e.g. "NXL". */
    league: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    /**
     * Optional: events are often announced before the venue is confirmed.
     * Google requires a location on Event structured data, so an event
     * without one is left out of the JSON-LD until it has one.
     */
    location: z
      .object({
        venue: z.string(),
        street: z.string().optional(),
        city: z.string(),
        /** State or province, e.g. "FL". */
        region: z.string().optional(),
        postalCode: z.string().optional(),
        /** ISO country code. */
        country: z.string().default('US'),
        mapUrl: z.url().optional(),
      })
      .optional(),
    /**
     * The league's page for this event, for details and results. Not a
     * sign-up link: players request a spot through /join and the event
     * captain registers the team (see `eventProcess` in site.yml).
     */
    eventUrl: z.url().optional(),
    /** Last day of each league fee tier. Pricing only: see closedToRequests. */
    feeDeadlines: z
      .object({
        early: z.coerce.date().optional(),
        regular: z.coerce.date().optional(),
        late: z.coerce.date().optional(),
      })
      .optional(),
    /** Ticked when the captain stops taking players. See isTakingRequests. */
    closedToRequests: z.boolean().default(false),
    /** The league's published fees PER TEAM, for the divisions we enter. */
    fees: z
      .array(
        z.object({
          format: z.string(),
          division: z.string(),
          early: z.number().int().nonnegative(),
          regular: z.number().int().nonnegative(),
          late: z.number().int().nonnegative(),
        })
      )
      .default([]),
    /**
     * Every Leftovers squad entered, as listed by the league. Counts and
     * best finishes are worked out from this in lib/events.ts.
     */
    squads: z
      .array(
        z.object({
          name: z.string(),
          division: z.string(),
          /** Final place, from the league's results. */
          place: z.number().int().positive().optional(),
          fieldSize: z.number().int().positive().optional().describe('Teams in the division'),
        })
      )
      .default([]),
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

/**
 * Videos: one YAML file each. The video and its captions live in
 * public/video/ (a fixed URL, served as-is; Astro doesn't process video) and
 * the poster in src/assets/img/videos/ like any photo. Make all three with `uv run scripts/prepare-video.py`.
 */
const videos = defineCollection({
  loader: glob({ base: './src/content/videos', pattern: '**/*.{yml,yaml}' }),
  schema: z.object({
    title: z.string(),
    /** One or two sentences: what's in it. Shown under the title and in search results. */
    description: z.string(),
    /** e.g. "/video/nxl-world-cup-promo.mp4". MP4 (H.264) plays everywhere. */
    file: z.string().regex(/^\/video\/[^/]+\.(mp4|webm)$/, 'A file in public/video, e.g. /video/promo.mp4'),
    /** The still shown before it plays. Required: without it the player is a black box. */
    poster: imagePath,
    posterAlt: z.string(),
    /** WebVTT captions, e.g. "/video/nxl-world-cup-promo.vtt". Leave empty for a music-only video. */
    captions: z
      .string()
      .regex(/^\/video\/[^/]+\.vtt$/, 'A .vtt file in public/video')
      .optional(),
    /** BCP 47 language of the captions. */
    captionsLang: z.string().default('en'),
    /**
     * Captions showing when it starts. Turn off when the video already has
     * subtitles in the picture, or the two sets of text stack up.
     */
    captionsOn: z.boolean().default(true),
    /** When it was first published (Google's VideoObject requires it). */
    uploadDate: z.coerce.date(),
    showOnHome: z.boolean().default(false),
    /** Lower sorts first. */
    order: z.number().default(100),
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
    /** A BrandRule above and below. */
    framed: z.boolean().default(false),
    eyebrow: optText,
    lines: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('divider'),
    ornament: z.enum(['peaks', 'field', 'cloud']).default('peaks'),
    spacing: z.enum(['sm', 'md', 'lg']).default('md'),
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
    items: z
      .array(
        z.object({
          /** Optional. Any stroked glyph in src/lib/icons.ts; .pages.yml lists them. */
          icon: z.enum(strokedIconNames as [StrokedIcon, ...StrokedIcon[]]).nullish(),
          title: z.string(),
          body: z.string(),
        })
      )
      .min(1),
  }),
  z.object({
    type: z.literal('featureRow'),
    eyebrow: optText,
    title: z.string(),
    body: z.string(),
    image: imagePath.nullish(),
    imageAlt: z.string().min(1),
    reverse: z.boolean().default(false),
    /** An app screenshot in a phone or browser outline, shown uncropped. */
    frame: z.enum(['none', 'phone', 'browser']).default('none'),
    frameLabel: optText,
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
    /** Every `team` entry as alternating cards. */
    type: z.literal('team'),
    tone: sectionTone,
    eyebrow: optText,
    title: optText,
  }),
  z
    .object({
      type: z.literal('quote'),
      tone: sectionTone,
      eyebrow: optText,
      title: optText,
      quote: z.string(),
      /** Who said it. */
      cite: z.string(),
      /** Where or when, e.g. the event or publication. */
      source: optText,
      /** Link to the original. */
      sourceUrl: optText,
      /** Optional. With one it's an ImpactBand; without, it's centred. */
      image: imagePath.nullish(),
      imageAlt: optText,
      /** Which side the quote sits on, with a photo. */
      align: z.enum(['left', 'right']).default('left'),
      shift: z.number().min(-30).max(30).nullish(),
      focus: optText,
    })
    .refine((quote) => !quote.image || quote.imageAlt, {
      message: 'A quote with a photo needs alt text.',
    }),
  z.object({
    type: z.literal('faq'),
    tone: sectionTone,
    eyebrow: optText,
    title: optText,
  }),
  z.object({
    /** The newest published blog posts. Renders nothing until there's one. */
    type: z.literal('posts'),
    tone: sectionTone,
    eyebrow: optText,
    title: optText,
    count: z.number().int().min(1).max(6).default(3),
    layout: z.enum(['cards', 'list']).default('cards'),
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

/**
 * Blog posts (Nov 2026): event recaps, announcements, team news. This is the
 * PRD's phase-2 `/news` section (§12), built as /blog; /news redirects here.
 *
 * Drafts build at /preview/blog/<slug>, noindexed, so an editor can check a
 * post before publishing. Published posts live at /blog/<slug>. Reading
 * time is DERIVED from the body (lib/posts.ts), never typed in.
 *
 * `author` and `event` hold entry ids (Pages CMS reference fields), so a
 * byline or a recap link can't be misspelt. An id that doesn't match an
 * entry is ignored rather than failing the build.
 */
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['draft', 'published']).default('draft'),
    publishDate: z.coerce.date(),
    /** Only for a real correction or update; shown, quietly, on the post page. */
    updatedDate: z.coerce.date().optional(),
    /** One or two sentences: the card teaser and the default meta description. */
    summary: z.string().max(200),
    /** The kind of post (src/lib/post-categories.ts): the card badge and the /blog filter. */
    category: z.enum(POST_CATEGORY_IDS).default('news'),
    /** A `team` entry id. */
    author: optText,
    /** An `events` entry id, for recaps. Links the post to the event card. */
    event: optText,
    cover: imagePath.nullish(),
    /** Required, as everywhere else an image appears (§6). */
    coverAlt: z.string(),
    tags: optList(z.string()),
    /** Leads the /blog page in the large layout. The newest featured post wins. */
    featured: z.boolean().default(false),
    seo,
  }),
});

export const collections = {
  landing,
  posts,
  team,
  events,
  sponsors,
  products,
  preorders,
  pages: pagesCollection,
  galleries,
  videos,
  faqs,
};
