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

/**
 * Players can still request a spot: the event hasn't passed and the league's
 * last entry deadline (when one is set) hasn't either.
 */
export function isTakingRequests(event: EventEntry, now = new Date()): boolean {
  if (!isUpcoming(event, now)) return false;
  const closes = event.data.feeDeadlines?.late;
  return !closes || closes.getTime() + 24 * 60 * 60 * 1000 > now.getTime();
}

export const seasonOf = (event: EventEntry) => event.data.startDate.getUTCFullYear();

/** The squad that placed highest, or undefined before results are in. */
export function bestFinish(event: EventEntry) {
  return event.data.squads
    .filter((squad) => squad.place)
    .sort((a, b) => (a.place ?? 0) - (b.place ?? 0))[0];
}

/** "3600 N Himes Ave, Tampa, FL 33607" */
export function addressLine(location: NonNullable<EventEntry['data']['location']>) {
  const place = [location.city, [location.region, location.postalCode].filter(Boolean).join(' ')];
  return [location.street, ...place].filter(Boolean).join(', ');
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
