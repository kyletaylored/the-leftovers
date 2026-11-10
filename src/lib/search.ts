/* -------------------------------------------------------------------------
 * Site search (Pagefind): the shared vocabulary between the pages that get
 * indexed (BaseLayout writes data-pagefind-* attributes) and the SiteSearch
 * island that queries the index. No astro:* imports: the island uses it too.
 *
 * Pagefind runs after `astro build` (package.json) and writes a static index
 * to dist/pagefind/. Nothing is sent anywhere: the visitor's browser
 * downloads index chunks from this site and searches them locally. It only
 * exists in a build, so search is empty under `npm run dev`.
 * ---------------------------------------------------------------------- */

/** The `type` filter values, in the order the search page offers them. */
export const SEARCH_TYPES = ['Pages', 'Blog posts', 'Events', 'Shop'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];
export const BLOG_TYPE: SearchType = 'Blog posts';

/** Which `type` a page is filed under, from its path. Blog posts set theirs in PostLayout. */
export function searchTypeFor(path: string): SearchType {
  if (path.startsWith('/blog/')) return BLOG_TYPE;
  if (path.startsWith('/events')) return 'Events';
  if (path.startsWith('/preorder') || path.startsWith('/shop')) return 'Shop';
  return 'Pages';
}

/** Pagefind splits key:value attributes on commas, so values can't hold one. */
export const searchValue = (value: string) => value.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * The build writes /blog/post.html (build.format 'file'); the site's real
 * URLs have no extension (GitHub Pages serves /blog/post for it).
 */
export const cleanResultUrl = (url: string) => url.replace(/(?:\/index)?\.html$/, '').replace(/^$/, '/') || '/';

/** The filter facets the search page understands, as URL query keys. */
export const SEARCH_FACETS = ['type', 'category', 'tag', 'year'] as const;
export type SearchFacet = (typeof SEARCH_FACETS)[number];
