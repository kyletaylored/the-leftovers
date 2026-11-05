import type { APIRoute } from 'astro';
import { redirectHtml } from '@/lib/redirect-page';

// Hand-entered stats were removed (Nov 2026); the record lives on /events.
export const GET: APIRoute = ({ site }) =>
  new Response(redirectHtml('/events', 'Events', site!.href), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
