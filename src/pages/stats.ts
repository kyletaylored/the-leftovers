import type { APIRoute } from 'astro';
import { redirectHtml } from '@/lib/redirect-page';

// /stats folded into /team (Oct 2026 page merge) — see src/pages/team.astro.
export const GET: APIRoute = ({ site }) =>
  new Response(redirectHtml('/team#stats', 'Team Stats', site!.href), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
