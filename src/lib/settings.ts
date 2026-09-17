import { load as parseYaml } from 'js-yaml';
import { z } from 'astro:content';
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
  description: z.string(),
  established: z.number(),
  homeBase: z.string(),
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
  instagramWidget: z
    .object({
      provider: z.string().default(''),
      scriptSrc: z.string().default(''),
      elementClass: z.string().default(''),
    })
    .prefault({}),
  mailingList: z.object({
    provider: z.string(),
    formAction: z.string().url(),
    emailFieldName: z.string().default('email'),
    hiddenFields: z.record(z.string(), z.string()).default({}),
  }),
  shop: z
    .object({
      bonfireUrl: z.string().default(''),
      alwaysOpenUrl: z.string().default(''),
    })
    .prefault({}),
  footerNote: z.string(),
});

const raw = parseYaml(rawSettings);

export const site = settingsSchema.parse(raw);
export type SiteSettings = typeof site;
