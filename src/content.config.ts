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
    location: z.object({
      venue: z.string(),
      city: z.string(),
      mapUrl: z.url().optional(),
    }),
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

const pagesCollection = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** Optional kicker shown above the page title. */
    eyebrow: z.string().optional(),
    intro: z.string().optional(),
    seo,
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

export const collections = {
  players,
  events,
  results,
  sponsors,
  products,
  pages: pagesCollection,
  faqs,
};
