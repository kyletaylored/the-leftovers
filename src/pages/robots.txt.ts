import type { APIRoute } from 'astro';
import { site } from '@/lib/settings';

/**
 * robots.txt (§10.3). Generated rather than static so the sitemap URL can't
 * drift from the configured `site`, and so the AI-crawler policy is one CMS
 * setting (`search.aiCrawlers` in site.yml) instead of a hand-edited file.
 *
 * Deliberately NO `Disallow` for hidden pages: a crawler that may not fetch
 * a page never sees its `noindex` tag, and Google can still list the bare
 * URL from links elsewhere. Hidden pages are handled by the robots meta tag
 * plus their absence from the sitemap (integrations/sitemap-noindex.mjs).
 *
 * AI bots are listed by their published user-agent tokens, split into the
 * ones that fetch a page to answer a user's question or build an AI search
 * index (good for being found) and the ones that collect training data.
 * `Google-Extended` and `Applebot-Extended` aren't separate crawlers: they're
 * opt-out tokens that stop Googlebot / Applebot content being used for
 * Gemini / Apple AI training, without affecting search.
 *
 * `Content-Signal` (contentsignals.org) states the same policy in one line
 * for crawlers that read it. Unknown lines are ignored by everyone else.
 */
const AI_SEARCH_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'DuckAssistBot',
  'MistralAI-User',
];
const AI_TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Bytespider',
  'Amazonbot',
  'cohere-training-data-crawler',
];

export const GET: APIRoute = ({ site: origin }) => {
  const policy = site.search.aiCrawlers;
  const blocked =
    policy === 'block' ? [...AI_SEARCH_BOTS, ...AI_TRAINING_BOTS] : policy === 'search-only' ? AI_TRAINING_BOTS : [];
  const signal = {
    allow: 'search=yes, ai-input=yes, ai-train=yes',
    'search-only': 'search=yes, ai-input=yes, ai-train=no',
    block: 'search=yes, ai-input=no, ai-train=no',
  }[policy];

  const lines = [
    `# AI crawler policy: ${policy} (search.aiCrawlers in src/data/site.yml)`,
    '',
    'User-agent: *',
    `Content-Signal: ${signal}`,
    'Allow: /',
    '',
  ];
  if (blocked.length > 0) {
    lines.push(...blocked.map((bot) => `User-agent: ${bot}`), 'Disallow: /', '');
  }
  lines.push(`Sitemap: ${new URL('sitemap-index.xml', origin).href}`, '');

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
