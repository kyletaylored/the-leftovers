/* -------------------------------------------------------------------------
 * Videos: the home page pick and VideoObject structured data.
 *
 * A video and its WebVTT captions live in public/video/; the poster is a
 * normal image under src/assets/img/videos/. `scripts/prepare-video.py`
 * makes all three, with a first draft of the captions from Whisper.
 * ---------------------------------------------------------------------- */
import { getCollection, type CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import { resolveImage } from './images';
import { isoDateTime } from './format';

export type VideoEntry = CollectionEntry<'videos'>;

/** The video the home page shows: the lowest `order` with showOnHome on. */
export async function homeVideo(): Promise<VideoEntry | undefined> {
  const videos = await getCollection('videos', ({ data }) => data.showOnHome);
  return videos.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id))[0];
}

/**
 * VideoObject structured data for a page that shows the video. Google needs
 * name, thumbnailUrl and uploadDate.
 */
export async function videoSchema(video: VideoEntry, site: URL) {
  const { title, description, file, poster, uploadDate } = video.data;
  const asset = await resolveImage(poster);
  const thumb = asset ? await getImage({ src: asset, width: 1280, format: 'jpg' }) : undefined;
  return {
    '@type': 'VideoObject',
    name: title,
    description,
    uploadDate: isoDateTime(uploadDate),
    contentUrl: new URL(file, site).href,
    ...(thumb ? { thumbnailUrl: new URL(thumb.src, site).href } : {}),
    publisher: { '@id': new URL('/#team', site).href },
  };
}
