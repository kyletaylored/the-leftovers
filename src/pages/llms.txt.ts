import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '@/lib/settings';

/**
 * /llms.txt (llmstxt.org): a plain-Markdown map of the site for AI assistants
 * and answer engines. A summary, then a link and one line per page. It's
 * a proposal rather than a ratified standard, and costs nothing: a static
 * text file built from the same content the pages render, so it can't go
 * stale.
 *
 * Only pages a search engine may index are listed: anything with
 * `seo.noindex` (the CMS's "Hide from search engines" box) is left out, the
 * same rule the sitemap follows. The FAQ is included while the Team page
 * (which shows it) is public. Answers like "can I join without a
 * tryout?" are what people ask assistants.
 */

/** Each `pages` entry renders at /<id>. These are reference, listed under Optional. */
const SECONDARY = new Set(['privacy', 'terms']);

export const GET: APIRoute = async ({ site: origin }) => {
  const url = (path: string) => new URL(path, origin).href;
  const pages = (await getCollection('pages', ({ data }) => !data.seo.noindex)).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const line = (title: string, path: string, about?: string) =>
    `- [${title}](${url(path)})${about ? `: ${about.replace(/\s+/g, ' ').trim()}` : ''}`;

  const core = pages.filter((p) => !SECONDARY.has(p.id));
  const secondary = pages.filter((p) => SECONDARY.has(p.id));

  const preorders = await getCollection(
    'preorders',
    ({ data }) => data.status !== 'draft' && !data.seo.noindex
  );

  // FAQs are only listed once a public page shows them.
  const faqsPublic = pages.some((p) => p.id === 'about');
  const faqs = faqsPublic
    ? (await getCollection('faqs')).sort((a, b) => a.data.order - b.data.order)
    : [];

  const out = [
    `# ${site.title}`,
    '',
    `> ${site.description.replace(/\s+/g, ' ').trim()}`,
    '',
    `${site.title} is a community paintball team (est. ${site.established}). Contact: ${site.social.email}.`,
    '',
    '## Pages',
    '',
    line('Home', '/', site.homeTitle),
    ...core.map((p) => line(p.data.title, `/${p.id}`, p.data.seo.description ?? p.data.intro)),
    ...(preorders.length
      ? ['', '## Pre-orders', '', ...preorders.map((p) => line(p.data.title, `/preorder/${p.id}`, p.data.seo.description ?? p.data.eyebrow))]
      : []),
    ...(faqs.length
      ? ['', '## FAQ', '', ...faqs.flatMap((f) => [`### ${f.data.question}`, '', f.data.answer.replace(/\s+/g, ' ').trim(), ''])]
      : ['']),
    '## Optional',
    '',
    ...secondary.map((p) => line(p.data.title, `/${p.id}`, p.data.seo.description ?? p.data.intro)),
    line('Credits', '/credits', 'Artwork and typeface licences.'),
    '',
  ];

  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
