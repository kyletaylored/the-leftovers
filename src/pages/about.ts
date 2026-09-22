import type { APIRoute } from 'astro';
import { redirectHtml } from '@/lib/redirect-page';

// /about folded into /team (Oct 2026 page merge) — see src/pages/team.astro.
export const GET: APIRoute = ({ site }) =>
  new Response(redirectHtml('/team#story', 'The Team', site!.href), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
