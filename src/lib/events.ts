import { getCollection, type CollectionEntry } from 'astro:content';

export type EventEntry = CollectionEntry<'events'>;

/**
 * Upcoming vs. past is DERIVED from the date, with the CMS `status` field as
 * an explicit override. Deriving it means nobody has to remember to flip a
 * flag the Monday after a tournament (PRD §13 — content upkeep is the real
 * risk on this project, so the site should need as little of it as possible).
 */
export function isUpcoming(event: EventEntry, now = new Date()): boolean {
  if (event.data.status) return event.data.status === 'upcoming';
  const end = event.data.endDate ?? event.data.startDate;
  // An event stays "upcoming" through the end of its final day.
  return end.getTime() + 24 * 60 * 60 * 1000 > now.getTime();
}

export async function getEvents() {
  const all = await getCollection('events');
  const upcoming = all
    .filter((e) => isUpcoming(e))
    .sort((a, b) => a.data.startDate.getTime() - b.data.startDate.getTime());
  const past = all
    .filter((e) => !isUpcoming(e))
    .sort((a, b) => b.data.startDate.getTime() - a.data.startDate.getTime());
  return { all, upcoming, past, next: upcoming[0] };
}
