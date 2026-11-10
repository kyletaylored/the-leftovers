/**
 * SiteSearch — full-site search on /search, backed by Pagefind
 * (https://pagefind.app), the same static search Astro Starlight uses.
 *
 * Why Pagefind: the site has no backend (AGENTS.md), and Pagefind needs
 * none. `npm run build` runs it over dist/ and it writes a chunked index to
 * dist/pagefind/. This island loads /pagefind/pagefind.js on demand and the
 * browser downloads only the index chunks a query needs, all from this site
 * (CSP: script-src needs 'wasm-unsafe-eval' for its WebAssembly).
 *
 * Built on Pagefind's JS API rather than its stock UI so it looks like the
 * rest of the site. Filters come from data-pagefind-filter attributes that
 * BaseLayout writes (src/lib/search.ts): a content type for every page, and
 * category / tag / year for blog posts. With filters and no words, it lists
 * everything that matches, newest first for posts, so it doubles as the
 * blog's "browse by year / tag" view.
 *
 * State lives in the URL (?q=&type=&category=&tag=&year=), so a search can
 * be shared and Back works. The server-rendered form is a plain GET to
 * /search, so before hydration (or without JS) submitting still lands here.
 *
 * A11y: role="search" form with a labelled input; content-type chips are
 * aria-pressed toggle buttons; result counts are announced through a
 * role="status" line; each result is one link (its title).
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { BLOG_TYPE, SEARCH_TYPES, cleanResultUrl } from '@/lib/search';

/* ---------------------------------------------------------------- types -- */

export interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: Record<string, string | undefined>;
  filters?: Record<string, string[]>;
}
export interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}
export interface PagefindResponse {
  results: PagefindResult[];
}
export type FilterCounts = Record<string, Record<string, number>>;
export interface PagefindApi {
  options?: (opts: Record<string, unknown>) => Promise<void>;
  init?: () => Promise<void>;
  search: (
    term: string | null,
    opts?: { filters?: Record<string, string>; sort?: Record<string, 'asc' | 'desc'> }
  ) => Promise<PagefindResponse | null>;
  filters: () => Promise<FilterCounts>;
}

interface Props {
  /** Where the Pagefind bundle is served. */
  bundlePath?: string;
  /** Use the built-in specimen index (for /design, where there's no build index). */
  demo?: boolean;
  /** Results per page before "Show more". */
  pageSize?: number;
  /** Swap in another index (Storybook). Takes precedence over `demo`. */
  loadPagefind?: () => Promise<PagefindApi>;
}

type Facets = { type: string; category: string; tag: string; year: string };
const NO_FACETS: Facets = { type: '', category: '', tag: '', year: '' };
const BLOG_FACETS = [
  { key: 'category', label: 'Category' },
  { key: 'tag', label: 'Tag' },
  { key: 'year', label: 'Year' },
] as const;

/* ----------------------------------------------------------- the island -- */

export default function SiteSearch({ bundlePath = '/pagefind/', demo = false, pageSize = 10, loadPagefind }: Props) {
  const uid = useId();
  const [api, setApi] = useState<PagefindApi>();
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [counts, setCounts] = useState<FilterCounts>({});
  const [query, setQuery] = useState('');
  const [facets, setFacets] = useState<Facets>(NO_FACETS);
  const [hits, setHits] = useState<PagefindResult[] | undefined>();
  const [shown, setShown] = useState<PagefindResultData[]>([]);
  const [busy, setBusy] = useState(false);
  const request = useRef(0);

  // Read the URL once, then load the index.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    setFacets({
      type: params.get('type') ?? '',
      category: params.get('category') ?? '',
      tag: params.get('tag') ?? '',
      year: params.get('year') ?? '',
    });

    let cancelled = false;
    setLoadState('loading');
    const load =
      loadPagefind ??
      (demo
        ? () => import('./site-search-demo').then((m) => m.demoPagefind)
        : () => {
            const url = `${bundlePath}pagefind.js`;
            return import(/* @vite-ignore */ url) as Promise<PagefindApi>;
          });
    load()
      .then(async (pf) => {
        await pf.options?.({ excerptLength: 22 });
        await pf.init?.();
        const filterCounts = await pf.filters();
        if (cancelled) return;
        setApi(pf);
        setCounts(filterCounts);
        setLoadState('ready');
      })
      .catch(() => !cancelled && setLoadState('error'));
    return () => {
      cancelled = true;
    };
  }, [bundlePath, demo, loadPagefind]);

  const active = query.trim() !== '' || Object.values(facets).some(Boolean);

  // Keep the URL in step, so searches can be shared and reloaded.
  useEffect(() => {
    if (loadState !== 'ready') return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    for (const [key, value] of Object.entries(facets)) if (value) params.set(key, value);
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, '', next);
  }, [query, facets, loadState]);

  // Run the search (debounced while typing).
  useEffect(() => {
    if (!api) return;
    if (!active) {
      setHits(undefined);
      setShown([]);
      return;
    }
    const id = ++request.current;
    const filters = Object.fromEntries(Object.entries(facets).filter(([, v]) => v));
    const term = query.trim() || null;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      const response = await api.search(term, {
        filters,
        // Browsing posts without words: newest first. (Only posts carry a
        // date, and Pagefind drops pages without the sort key, so never
        // sort a mixed list.)
        ...(!term && facets.type === BLOG_TYPE ? { sort: { date: 'desc' as const } } : {}),
      });
      if (id !== request.current || !response) return;
      const first = await Promise.all(response.results.slice(0, pageSize).map((r) => r.data()));
      if (id !== request.current) return;
      setHits(response.results);
      setShown(first);
      setBusy(false);
    }, term ? 200 : 0);
    return () => window.clearTimeout(timer);
  }, [api, active, query, facets, pageSize]);

  const showMore = useCallback(async () => {
    if (!hits) return;
    const more = await Promise.all(hits.slice(shown.length, shown.length + pageSize).map((r) => r.data()));
    setShown((prev) => [...prev, ...more]);
  }, [hits, shown.length, pageSize]);

  const setType = (type: string) => setFacets({ ...NO_FACETS, type: facets.type === type ? '' : type });

  const typeCounts = counts.type ?? {};
  const types = SEARCH_TYPES.filter((t) => typeCounts[t]);
  const blog = facets.type === BLOG_TYPE;
  const total = hits?.length ?? 0;
  const status =
    loadState === 'error'
      ? import.meta.env.DEV
        ? 'Search runs on the built site: npm run build, then npm run preview.'
        : 'Search couldn’t load. Try reloading the page.'
      : loadState !== 'ready'
        ? 'Loading search…'
        : !active
          ? 'Type to search the whole site, or pick a type to browse it.'
          : busy && !hits
            ? 'Searching…'
            : total === 0
              ? `Nothing matches${query.trim() ? ` “${query.trim()}”` : ''}. Try fewer words or clear a filter.`
              : `${total} result${total === 1 ? '' : 's'}${query.trim() ? ` for “${query.trim()}”` : ''}.`;

  return (
    <div className="flex flex-col gap-6">
      <form action="/search" method="get" role="search" aria-label="Site" onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
        <div>
          <label htmlFor={`${uid}-q`} className="field-label">
            Search the site
          </label>
          <input
            id={`${uid}-q`}
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Events, players, gear, recaps…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field-input text-base"
          />
        </div>

        {types.length > 0 && (
          <div role="group" aria-label="Content type" className="flex flex-wrap gap-2">
            {types.map((type) => {
              const on = facets.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setType(type)}
                  className={[
                    'tap inline-flex items-center gap-1.5 rounded-full px-3.5 text-[0.6875rem] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
                    on ? 'bg-gold text-ink' : 'border border-ink-600 text-bone-muted hover:border-gold hover:text-gold-300',
                  ].join(' ')}
                >
                  {type}
                  <span className={on ? 'text-xs font-semibold tabular-nums tracking-normal text-ink/70' : 'text-xs font-semibold tabular-nums tracking-normal text-bone-muted/70'}>
                    {typeCounts[type]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {blog && (
          <div className="grid gap-3 sm:grid-cols-3">
            {BLOG_FACETS.map(({ key, label }) => {
              const options = Object.entries(counts[key] ?? {}).sort(([a], [b]) =>
                key === 'year' ? b.localeCompare(a) : a.localeCompare(b)
              );
              if (!options.length) return null;
              return (
                <div key={key}>
                  <label htmlFor={`${uid}-${key}`} className="field-label">
                    {label}
                  </label>
                  <select
                    id={`${uid}-${key}`}
                    value={facets[key]}
                    onChange={(event) => setFacets({ ...facets, [key]: event.target.value })}
                    className="field-input"
                  >
                    <option value="">Any {label.toLowerCase()}</option>
                    {options.map(([value, n]) => (
                      <option key={value} value={value}>
                        {value} ({n})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
        <noscript>
          <button type="submit" className="tap rounded-sm bg-gold px-4 font-bold text-ink">
            Search
          </button>
        </noscript>
      </form>

      <p role="status" className="text-sm text-bone-muted">
        {status}
      </p>

      {shown.length > 0 && (
        <ol className="grid gap-3" aria-label="Search results">
          {shown.map((result) => (
            <SearchResult key={result.url} result={result} />
          ))}
        </ol>
      )}

      {hits && shown.length < hits.length && (
        <div>
          <button
            type="button"
            onClick={showMore}
            className="tap inline-flex items-center rounded-sm border border-gold px-5 text-xs font-bold uppercase tracking-[0.14em] text-gold-300 transition-colors hover:bg-gold hover:text-ink"
          >
            Show more ({hits.length - shown.length} left)
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- a result -- */

function SearchResult({ result }: { result: PagefindResultData }) {
  const { meta, filters = {} } = result;
  const type = filters.type?.[0];
  const label = type === BLOG_TYPE && filters.category?.[0] ? `${filters.category[0]} · ${meta.date ?? ''}` : type;
  return (
    <li className="group relative flex gap-4 rounded-sm border border-ink-600 bg-ink-800 p-4 transition-colors hover:border-gold/50 has-[a:focus-visible]:border-gold has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-gold/60 sm:p-5">
      {/* `thumb`, not Pagefind's own `image`: that one falls back to any
          photo on the page, which would put a stranger's photo on a post
          that has no cover. PostLayout sets thumb only from the cover. */}
      {meta.thumb && (
        <img
          src={meta.thumb}
          alt=""
          width={160}
          height={90}
          loading="lazy"
          decoding="async"
          className="hidden aspect-[16/9] w-32 shrink-0 self-start rounded-sm border border-ink-600 object-cover sm:block"
        />
      )}
      <div className="min-w-0 flex-1">
        {label && (
          <p className="mb-1 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-gold-300">
            {label.replace(/ · $/, '')}
          </p>
        )}
        <h2 className="title-sm text-lg text-bone">
          <a
            href={cleanResultUrl(result.url)}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-hover:text-gold-300"
          >
            {meta.title ?? cleanResultUrl(result.url)}
          </a>
        </h2>
        {/* Pagefind escapes page text and adds only <mark> around matches. */}
        <p
          className="mt-1.5 text-sm leading-relaxed text-bone-muted [&_mark]:bg-gold/25 [&_mark]:px-0.5 [&_mark]:text-bone"
          dangerouslySetInnerHTML={{ __html: result.excerpt }}
        />
      </div>
    </li>
  );
}
