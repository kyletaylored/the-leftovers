# Search, sitemaps and AI crawlers

How the site tells Google, Bing and AI assistants what to read, and how to
connect it to Google Search Console. Nothing here needs a backend: every file
below is generated at build time from the content.

## What the build publishes

| URL | What it is | Source |
|---|---|---|
| `/sitemap-index.xml` → `/sitemap-0.xml` | Every page search engines may list | `@astrojs/sitemap` + `integrations/sitemap-noindex.mjs` |
| `/robots.txt` | Crawl rules, AI-crawler policy, sitemap location | `src/pages/robots.txt.ts` |
| `/llms.txt` | A Markdown map of the site for AI assistants ([llmstxt.org](https://llmstxt.org)) | `src/pages/llms.txt.ts` |
| `<meta name="robots">` | `noindex, follow` on hidden pages | `src/components/Seo.astro` |
| `/blog/rss.xml` | RSS feed of published blog posts (titles and summaries) | `src/pages/blog/rss.xml.ts` |
| `/pagefind/` | The on-site search index `/search` reads (not for crawlers) | `pagefind --site dist`, after `astro build` |

Every page also carries a canonical URL, Open Graph and Twitter tags, a
`<link rel="sitemap">`, and JSON-LD (`SportsTeam` on every page, `WebSite` on
the homepage). See `Seo.astro` and `BaseLayout.astro`. Blog posts add
`BlogPosting` + `BreadcrumbList`, `og:type article` with `article:*` times and
tags, and the cover cropped to a 1200×630 share card (`PostLayout.astro`).
`/blog` itself is noindex until the first post is published. Category
archives (`/blog/category/…`) are indexable; tag archives are noindex, since
they're thin and multiply. `/search` is noindex.

Site search follows the same switch: a noindex page is also left out of the
on-site search index (BaseLayout only marks `<main>` as searchable when the
page is indexable).

## Hiding a page from search

One switch: **Hide from search engines** (`seo.noindex`) on a Page copy or
Pre-order drop entry in the CMS. Ticking it:

1. adds `<meta name="robots" content="noindex, follow">` to the page,
2. removes it from the sitemap (the integration reads the built HTML and
   drops every page whose robots tag says `noindex`), and
3. leaves it out of `/llms.txt`.

The page still works for anyone with the link. Events, Shop and
Community are hidden this way right now (Nov 2026), in their content files.

Code-only pages (`/design`, `/404`, the `/about` `/roster` `/stats` redirect
stubs) set `noindex` in code, and the sitemap drops them by the same rule.
There is no separate exclusion list to keep in sync.

**Why hidden pages are not `Disallow`ed in robots.txt:** a crawler that isn't
allowed to fetch a page never sees its `noindex` tag, and Google can still
list the bare URL if something links to it. `noindex` with crawling allowed
is what actually keeps a page out of results.

## AI crawlers

`search.aiCrawlers` in `src/data/site.yml` (CMS: Site settings → Search
engines & AI crawlers) sets the policy in `robots.txt`:

| Setting | Effect |
|---|---|
| `allow` (default) | Every bot may read the site. Most visibility in ChatGPT, Claude, Perplexity and Gemini answers |
| `search-only` | AI search and answer bots allowed (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot…); AI-training bots blocked (GPTBot, ClaudeBot, Google-Extended, CCBot…) |
| `block` | All of those AI bots blocked |

Google and Bing **search** are never affected. `Google-Extended` only opts
the site out of Gemini training, not out of Google Search. The same policy is
also written as a `Content-Signal` line ([contentsignals.org](https://contentsignals.org)).
robots.txt is a request that reputable crawlers follow, not access control.

## Connecting Google Search Console (one-off, by the owner)

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
   and **Add property**.
2. Choose **Domain** and enter `theleftoverspb.com`. This covers http, https
   and `www` in one property.
3. Google shows a `TXT` record (`google-site-verification=…`). Add it in the
   domain registrar's DNS settings, wait a few minutes, then click **Verify**.
   DNS verification needs no change to the site.
   - Prefer an HTML tag instead (a "URL prefix" property)? Paste only the
     `content="…"` value into Site settings → Google Search Console
     verification code. The site emits the meta tag on every page.
4. In the property, open **Sitemaps** and submit
   `https://theleftoverspb.com/sitemap-index.xml`. Status should go to
   "Success" within a day. Search Console re-reads it on its own after that,
   so there's no need to resubmit after each deploy.
5. Optional: **URL Inspection** → paste the homepage → **Request indexing**
   to speed up the first crawl.

**Bing (and DuckDuckGo, Yahoo, ChatGPT search, which use Bing's index):** in
[Bing Webmaster Tools](https://www.bing.com/webmasters), choose **Import from
Google Search Console**. It copies the verified site and the sitemap in one
step. Otherwise paste Bing's `msvalidate.01` value into the Bing
verification setting.

## What moves rankings here

The technical side is covered. What's left is content the site doesn't have
yet: real event results, player pages and photos, and links from PBLeague,
event organisers and sponsors back to the site. Search Console's
**Performance** report shows what people actually search for to find the
site. Write page titles and descriptions for those words.
