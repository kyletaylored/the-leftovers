/* -------------------------------------------------------------------------
 * Videos: captions, transcripts and the home page pick.
 *
 * A video's captions are a WebVTT file next to it in public/video/. The
 * on-page transcript is BUILT from that file, never typed in separately, so
 * fixing a misheard word in the .vtt fixes both (content holds what a human
 * checked; the transcript is derived). `scripts/prepare-video.py` makes the
 * first draft of the file with Whisper.
 *
 * The .vtt is read with fs from the project root at build time. Not `?raw`:
 * the CMS can add files Vite has never seen, and public/ files can't be
 * imported. process.cwd() is the project root in dev and in the prerender.
 * ---------------------------------------------------------------------- */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import { resolveImage } from './images';
import { isoDate } from './format';

export type VideoEntry = CollectionEntry<'videos'>;

export interface Cue {
  /** Seconds from the start. */
  start: number;
  end: number;
  text: string;
}

const TIME = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{3})$/;

function seconds(stamp: string): number {
  const m = TIME.exec(stamp.trim());
  if (!m) return NaN;
  const [, h = '0', min, s, ms] = m;
  return Number(h) * 3600 + Number(min) * 60 + Number(s) + Number(ms) / 1000;
}

/**
 * Parses WebVTT cues. Ignores the header, NOTE/STYLE/REGION blocks, cue ids
 * and cue settings, and strips inline tags (<v Name>, <i>, <c.x>,
 * timestamps) so the transcript reads as plain text.
 */
export function parseVtt(source: string): Cue[] {
  const blocks = source.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split(/\n{2,}/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at < 0) continue;
    const [from, rest = ''] = lines[at].split('-->');
    const start = seconds(from);
    const end = seconds(rest.trim().split(/\s+/)[0] ?? '');
    const text = lines
      .slice(at + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (Number.isFinite(start) && text) cues.push({ start, end: Number.isFinite(end) ? end : start, text });
  }
  return cues;
}

/** The cues of a public-folder .vtt path like "/video/promo.vtt"; [] if it's missing. */
export function readCaptions(path?: string): Cue[] {
  if (!path) return [];
  const file = join(process.cwd(), 'public', path.replace(/^\/+/, ''));
  if (!existsSync(file)) {
    console.warn(`[video] no captions file at "${path}"`);
    return [];
  }
  return parseVtt(readFileSync(file, 'utf8'));
}

/** "1:05", or "1:02:05" past an hour. For transcript timestamps. */
export function clock(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** The video the home page shows: the lowest `order` with showOnHome on. */
export async function homeVideo(): Promise<VideoEntry | undefined> {
  const videos = await getCollection('videos', ({ data }) => data.showOnHome);
  return videos.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id))[0];
}

/**
 * VideoObject structured data for a page that shows the video. Google needs
 * name, thumbnailUrl and uploadDate; the transcript is the captions' text.
 */
export async function videoSchema(video: VideoEntry, site: URL) {
  const { title, description, file, poster, captions, captionsLang, uploadDate } = video.data;
  const asset = await resolveImage(poster);
  const thumb = asset ? await getImage({ src: asset, width: 1280, format: 'jpg' }) : undefined;
  const transcript = readCaptions(captions)
    .map((cue) => cue.text)
    .join(' ');
  return {
    '@type': 'VideoObject',
    name: title,
    description,
    uploadDate: isoDate(uploadDate),
    contentUrl: new URL(file, site).href,
    ...(thumb ? { thumbnailUrl: new URL(thumb.src, site).href } : {}),
    ...(transcript ? { transcript, inLanguage: captionsLang } : {}),
    publisher: { '@id': new URL('/#team', site).href },
  };
}
