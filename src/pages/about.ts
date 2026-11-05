import type { APIRoute } from 'astro';
import { redirectHtml } from '@/lib/redirect-page';

// Nothing lives at /about yet (Nov 2026). Replace this stub when the page is built.
export const GET: APIRoute = ({ site }) =>
  new Response(redirectHtml('/', 'Home', site!.href), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
