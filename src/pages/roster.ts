import type { APIRoute } from 'astro';
import { redirectHtml } from '@/lib/redirect-page';

// The roster was removed (Nov 2026); keeps old links from 404ing.
export const GET: APIRoute = ({ site }) =>
  new Response(redirectHtml('/', 'Home', site!.href), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
