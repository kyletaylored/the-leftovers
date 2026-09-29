import type { APIRoute } from 'astro';
import { redirectHtml } from '@/lib/redirect-page';

// This drop was renamed from the BCA-only "Pink Jersey Drop" to the general
// "Leftovers Jersey" pre-order (V1/V2/BCA variants) — see
// src/content/preorders/2026-leftovers-jersey.md.
export const GET: APIRoute = ({ site }) =>
  new Response(redirectHtml('/preorder/2026-leftovers-jersey', 'Leftovers Jersey', site!.href), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
