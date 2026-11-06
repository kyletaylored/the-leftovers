import type { APIRoute } from 'astro';
import { redirectHtml } from '@/lib/redirect-page';

// The About page is a hidden draft at /preview/about (src/content/landing/about.yml).
// To publish it, delete this file and set that entry's status to published.
export const GET: APIRoute = ({ site }) =>
  new Response(redirectHtml('/', 'Home', site!.href), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
