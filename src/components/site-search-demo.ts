/**
 * A tiny in-memory stand-in for the Pagefind index, with the same API shape
 * SiteSearch uses. For the /design specimen (`demo`) and Storybook, where
 * no build index exists. Every entry is labelled as a specimen; none of it
 * is real team content. Loaded with a dynamic import, so it never ships
 * with the real search page.
 */
import type { FilterCounts, PagefindApi, PagefindResultData } from './SiteSearch';

const docs: (PagefindResultData & { text: string; sort?: string })[] = [
  {
    url: '/blog/specimen-recap.html',
    meta: { title: 'Specimen post: a featured recap', date: '16 Nov 2026' },
    filters: { type: ['Blog posts'], category: ['Recap'], tag: ['Specimen', 'Bushball'], year: ['2026'] },
    text: 'Specimen recap text. How the squad played the bushball field, the breakout and the final round.',
    sort: '2026-11-16',
    excerpt: '',
  },
  {
    url: '/blog/specimen-gear.html',
    meta: { title: 'Specimen post: a gear guide', date: '2 Oct 2026' },
    filters: { type: ['Blog posts'], category: ['Gear'], tag: ['Specimen'], year: ['2026'] },
    text: 'Specimen gear text. What to bring to your first practice: mask, marker, pods and water.',
    sort: '2026-10-02',
    excerpt: '',
  },
  {
    url: '/blog/specimen-news.html',
    meta: { title: 'Specimen post: last season', date: '14 Sep 2025' },
    filters: { type: ['Blog posts'], category: ['News'], tag: ['Specimen'], year: ['2025'] },
    text: 'Specimen news text from last season, about practice nights and new players.',
    sort: '2025-09-14',
    excerpt: '',
  },
  {
    url: '/join.html',
    meta: { title: 'Join the team' },
    filters: { type: ['Pages'] },
    text: 'Specimen page text. How to join, practice nights, and what a first event looks like.',
    excerpt: '',
  },
  {
    url: '/events.html',
    meta: { title: 'Events' },
    filters: { type: ['Events'] },
    text: 'Specimen events text. The season schedule, squads and fees.',
    excerpt: '',
  },
];

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const escapeRegExp = (s: string) => s.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');

function excerpt(text: string, words: string[]) {
  let html = escape(text);
  for (const word of words) html = html.replace(new RegExp(`(${escapeRegExp(word)})`, 'gi'), '<mark>$1</mark>');
  return html;
}

function countFilters(list: typeof docs): FilterCounts {
  const counts: FilterCounts = {};
  for (const doc of list)
    for (const [key, values] of Object.entries(doc.filters ?? {}))
      for (const value of values) {
        counts[key] ??= {};
        counts[key][value] = (counts[key][value] ?? 0) + 1;
      }
  return counts;
}

export const demoPagefind: PagefindApi = {
  async filters() {
    return countFilters(docs);
  },
  async search(term, opts = {}) {
    const words = (term ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    let matches = docs.filter(
      (doc) =>
        Object.entries(opts.filters ?? {}).every(([key, value]) => doc.filters?.[key]?.includes(value)) &&
        words.every((w) => `${doc.meta.title} ${doc.text}`.toLowerCase().includes(w))
    );
    if (opts.sort?.date) matches = matches.filter((d) => d.sort).sort((a, b) => b.sort!.localeCompare(a.sort!));
    return {
      results: matches.map((doc) => ({
        id: doc.url,
        data: async () => ({ ...doc, excerpt: excerpt(doc.text, words) }),
      })),
    };
  },
};
