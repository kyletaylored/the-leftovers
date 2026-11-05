import { load as parseYaml } from 'js-yaml';
import * as z from 'astro/zod';
// `?raw` inlines the file at build time. Reading it with fs at runtime would
// work in dev and then fail in the prerender step, where the YAML isn't
// copied next to the bundled module.
import rawSettings from '../data/site.yml?raw';

/* -------------------------------------------------------------------------
 * Site settings are a single CMS-editable YAML file rather than a collection,
 * because there is exactly one of them. Parsing through a Zod schema at build
 * time means a typo in the CMS fails the build loudly instead of silently
 * rendering an empty nav.
 * ---------------------------------------------------------------------- */

const linkSchema = z.object({ label: z.string(), href: z.string() });

const settingsSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  /** Homepage search-result title; falls back to "Title — Tagline". */
  homeTitle: z.string().optional(),
  description: z.string(),
  established: z.number(),
  homeBase: z.string().default(''),
  nav: z.array(linkSchema).min(1),
  primaryCta: linkSchema,
  social: z.object({
    instagram: z.string().optional(),
    facebookGroup: z.string().optional(),
    discord: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
    email: z.string(),
  }),
  discordServerId: z.string().default(''),
  /**
   * Search engines and AI crawlers. Verification tokens are optional: a
   * Search Console *domain* property verified by DNS needs none (see
   * docs/SEO.md). `aiCrawlers` drives robots.txt:
   * - allow: every crawler, AI or not (the default; most visibility).
   * - search-only: AI answer/search bots allowed, AI-training bots blocked.
   * - block: all known AI bots blocked. Ordinary search engines unaffected.
   */
  search: z
    .object({
      googleSiteVerification: z.string().default(''),
      bingSiteVerification: z.string().default(''),
      aiCrawlers: z.enum(['allow', 'search-only', 'block']).default('allow'),
    })
    .prefault({}),
  /**
   * Datadog Real User Monitoring, gated by CookieConsent like GTM. Off until
   * both applicationId and clientToken are set; both are public values.
   * `site` is the Datadog region host, e.g. datadoghq.com or datadoghq.eu.
   */
  datadogRum: z
    .object({
      applicationId: z.string().default(''),
      clientToken: z.string().default(''),
      /** Optional: Datadog-hosted config (sampling etc.) editable in the Datadog UI. */
      remoteConfigurationId: z.string().default(''),
      site: z.string().default('datadoghq.com'),
      service: z.string().default('the-leftovers'),
      env: z.string().default('production'),
      sessionSampleRate: z.number().min(0).max(100).default(100),
      sessionReplaySampleRate: z.number().min(0).max(100).default(0),
      defaultPrivacyLevel: z.enum(['mask', 'mask-user-input', 'allow']).default('mask-user-input'),
    })
    .prefault({}),
  /** Google Tag Manager container ID (e.g. "GTM-KPXD7QD6"), gated by CookieConsent. */
  gtmId: z.string().default(''),
  facebookPagePlugin: z
    .object({
      enabled: z.boolean().default(false),
      pageUrl: z.string().default(''),
    })
    .prefault({}),
  instagramWidget: z
    .object({
      provider: z.string().default(''),
      scriptSrc: z.string().default(''),
      elementClass: z.string().default(''),
    })
    .prefault({}),
  mailingList: z.object({
    provider: z.string().default(''),
    /** Empty until a provider is chosen; the UI degrades rather than break. */
    formAction: z.union([z.url(), z.literal('')]).default(''),
    emailFieldName: z.string().default('email'),
    hiddenFields: z.record(z.string(), z.string()).default({}),
  }),
  preorderForm: z
    .object({
      provider: z.string().default(''),
      endpoint: z.string().default(''),
      turnstileSiteKey: z.string().default(''),
      googleFormFields: z.record(z.string(), z.string()).default({}),
    })
    .prefault({}),
  shop: z
    .object({
      bonfireUrl: z.string().default(''),
      alwaysOpenUrl: z.string().default(''),
    })
    .prefault({}),
  /** Leagues shown as a logo row on the homepage. `logo` is a CMS image path. */
  leagues: z
    .array(z.object({ name: z.string(), logo: z.string(), logoAlt: z.string() }))
    .default([]),
  footerNote: z.string(),
  /** How a player gets onto a squad: shown on /events and /join. */
  eventProcess: z
    .object({
      steps: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
      /** Shown under a fee table, to say what the numbers are. */
      feeNote: z.string().default(''),
    })
    .prefault({}),
  pblidb: z
    .object({
      /** Fuzzy query sent to pblidb.org's team search (`GET /v1/teams?q=`).
       *  "leftovers" matches every "The Leftovers"/"Leftovers" team pblidb
       *  has indexed across seasons/divisions, not just ours — that's the
       *  point (§6, multi-widget stats). Leave blank to turn the stats
       *  section off without a code change. */
      query: z.string().default(''),
    })
    .prefault({}),
  // /join — request-to-play form (name, contact, division, player class,
  // event, payment method). Same handoff/post pattern as `preorderForm`:
  // leave `endpoint` empty and the form still works, formatting the request
  // for the visitor to send themselves. Point `endpoint` at a Google Form's
  // `formResponse` URL (provider: google-form) once one exists, with
  // `fieldMap` mapping our field names to its `entry.NNN` ids.
  join: z
    .object({
      provider: z.string().default(''),
      endpoint: z.string().default(''),
      fieldMap: z.record(z.string(), z.string()).default({}),
      /** Event dropdown, worded exactly as the Google Form's Event question. */
      events: z.array(z.string()).default([]),
      paymentMethods: z
        .array(z.object({ label: z.string(), handle: z.string().optional() }))
        .default([]),
    })
    .prefault({}),
});

const raw = parseYaml(rawSettings);

export const site = settingsSchema.parse(raw);
export type SiteSettings = typeof site;
