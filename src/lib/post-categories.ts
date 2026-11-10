/* -------------------------------------------------------------------------
 * Blog post categories: one per post, a fixed list.
 *
 * A category is the KIND of post (the badge on its card and the /blog
 * filter); tags are the free-form topics. Keeping categories fixed keeps the
 * filter row short and stops "Recap" / "Recaps" / "Event recap" splitting.
 *
 * No astro:* imports, so src/content.config.ts can read it. To add one, add
 * a row here AND the same value to the Category select in .pages.yml.
 * ---------------------------------------------------------------------- */
export const POST_CATEGORIES = [
  { id: 'news', label: 'News', title: 'Team news' },
  { id: 'recap', label: 'Recap', title: 'Event recaps' },
  { id: 'gear', label: 'Gear', title: 'Gear' },
  { id: 'training', label: 'Training', title: 'Training' },
] as const;

export type PostCategoryId = (typeof POST_CATEGORIES)[number]['id'];
export type PostCategory = (typeof POST_CATEGORIES)[number];

export const POST_CATEGORY_IDS = POST_CATEGORIES.map((c) => c.id) as [PostCategoryId, ...PostCategoryId[]];

export const categoryById = (id: string): PostCategory =>
  POST_CATEGORIES.find((c) => c.id === id) ?? POST_CATEGORIES[0];

export const categoryHref = (id: string) => `/blog/category/${id}`;

/** "Bush ball" → "bush-ball": a tag's URL segment. */
export const tagSlug = (tag: string) =>
  tag
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const tagHref = (tag: string) => `/blog/tag/${tagSlug(tag)}`;
