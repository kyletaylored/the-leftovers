/* -------------------------------------------------------------------------
 * Blog posts: loading, ordering and the values derived from them.
 *
 * Content holds only what a person wrote. Reading time, ordering, the
 * featured post and author/event lookups are worked out here, so none of
 * them can go stale in a content file.
 *
 * Components take a `PostSummary`, not a collection entry. That keeps them
 * renderable from /design with specimen data while there are no real posts,
 * and means the image is resolved once, here, not in every card.
 * ---------------------------------------------------------------------- */
import { getCollection, type CollectionEntry } from 'astro:content';
import { resolveImage } from './images';

export type PostEntry = CollectionEntry<'posts'>;

export interface PostSummary {
  id: string;
  href: string;
  title: string;
  summary: string;
  publishDate: Date;
  updatedDate?: Date;
  /** The author's name and role, from the `team` entry. */
  author?: { name: string; role: string };
  tags: string[];
  cover?: ImageMetadata;
  coverAlt: string;
  readingMinutes: number;
  featured: boolean;
}

/** About 225 words a minute; never "0 min". */
const WORDS_PER_MINUTE = 225;

export function readingMinutes(markdown = ''): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter((w) => /\w/.test(w)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export const postHref = (id: string) => `/blog/${id}`;
export const previewHref = (id: string) => `/preview/blog/${id}`;

/**
 * Pages CMS saves a reference as the file name, sometimes with its folder or
 * extension; a collection id has neither.
 */
export const refId = (value?: string) =>
  value?.split('/').pop()?.replace(/\.(md|ya?ml)$/, '') || undefined;

const newestFirst = (a: PostEntry, b: PostEntry) =>
  b.data.publishDate.getTime() - a.data.publishDate.getTime() || a.data.title.localeCompare(b.data.title);

/** Published posts, newest first. */
export async function getPosts(): Promise<PostEntry[]> {
  return (await getCollection('posts', ({ data }) => data.status === 'published')).sort(newestFirst);
}

/** Drafts, for the /preview/blog pages. */
export async function getDraftPosts(): Promise<PostEntry[]> {
  return (await getCollection('posts', ({ data }) => data.status === 'draft')).sort(newestFirst);
}

/** The post that leads /blog: the newest featured one, else the newest. */
export const leadPost = <T extends { featured: boolean }>(posts: T[]) => posts.find((p) => p.featured) ?? posts[0];

let teamCache: Promise<CollectionEntry<'team'>[]> | undefined;
const team = () => (teamCache ??= getCollection('team'));

export async function authorOf(post: PostEntry) {
  const id = refId(post.data.author);
  if (!id) return undefined;
  const member = (await team()).find((m) => m.id === id);
  return member ? { name: member.data.name, role: member.data.role } : undefined;
}

export async function eventOf(post: PostEntry) {
  const id = refId(post.data.event);
  if (!id) return undefined;
  return (await getCollection('events')).find((e) => e.id === id);
}

export async function summarize(post: PostEntry, href = postHref(post.id)): Promise<PostSummary> {
  const { title, summary, publishDate, updatedDate, tags, cover, coverAlt, featured } = post.data;
  return {
    id: post.id,
    href,
    title,
    summary,
    publishDate,
    updatedDate,
    author: await authorOf(post),
    tags,
    cover: await resolveImage(cover ?? undefined),
    coverAlt,
    readingMinutes: readingMinutes(post.body),
    featured,
  };
}

/** Event id → the newest published post about it, for EventCard's recap link. */
export async function recapsByEvent(): Promise<Map<string, string>> {
  const recaps = new Map<string, string>();
  for (const post of await getPosts()) {
    const id = refId(post.data.event);
    if (id && !recaps.has(id)) recaps.set(id, postHref(post.id));
  }
  return recaps;
}

/** The newest `count` published posts as summaries, optionally skipping one. */
export async function latestPosts(count = 3, exclude?: string): Promise<PostSummary[]> {
  const posts = (await getPosts()).filter((p) => p.id !== exclude).slice(0, count);
  return Promise.all(posts.map((p) => summarize(p)));
}
