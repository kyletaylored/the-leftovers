import type { APIRoute } from 'astro';
import { categoryById, getPosts, postHref } from '@/lib/posts';
import { site } from '@/lib/settings';

/**
 * /blog/rss.xml: an RSS 2.0 feed of the newest published posts, for feed
 * readers and anyone who'd rather not follow on social. Hand-written rather
 * than @astrojs/rss: it's thirty lines and one fewer dependency. Titles and
 * summaries only (no full bodies), so the feed never needs its own
 * Markdown-to-HTML pass. Posts marked "Hide from search engines" stay out.
 */
const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site: origin }) => {
  const url = (path: string) => new URL(path, origin).href;
  const posts = (await getPosts()).filter((p) => !p.data.seo.noindex).slice(0, 30);

  const items = posts.map((post) => {
    const link = url(postHref(post.id));
    return [
      '    <item>',
      `      <title>${escape(post.data.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <pubDate>${post.data.publishDate.toUTCString()}</pubDate>`,
      `      <description>${escape(post.data.summary)}</description>`,
      `      <category>${escape(categoryById(post.data.category).label)}</category>`,
      ...post.data.tags.map((tag) => `      <category>${escape(tag)}</category>`),
      '    </item>',
    ].join('\n');
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escape(`${site.title} blog`)}</title>`,
    `    <link>${url('/blog')}</link>`,
    `    <atom:link href="${url('/blog/rss.xml')}" rel="self" type="application/rss+xml" />`,
    `    <description>${escape(site.description.replace(/\s+/g, ' ').trim())}</description>`,
    '    <language>en-us</language>',
    ...(posts[0] ? [`    <lastBuildDate>${posts[0].data.publishDate.toUTCString()}</lastBuildDate>`] : []),
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
