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
 * Players can still request a spot: the event hasn't passed and nobody has
 * ticked "Closed to new players" in the CMS. The league's fee deadlines are
 * deliberately not part of this. They set what a team pays, not when the
 * captain stops taking players.
 */
export function isTakingRequests(event: EventEntry, now = new Date()): boolean {
  return isUpcoming(event, now) && !event.data.closedToRequests;
}

export const seasonOf = (event: EventEntry) => event.data.startDate.getUTCFullYear();

/** The name without its year, for places already grouped by season. */
export const shortTitle = (event: EventEntry) => event.data.title.replace(/\s+\d{4}$/, '');

/**
 * "Lone Star Open 2026". Titles carry the year so the same event in different
 * seasons can be told apart in the CMS; this still reads right if an editor
 * leaves it off, and never doubles it.
 */
export const fullTitle = (event: EventEntry) => `${shortTitle(event)} ${seasonOf(event)}`;

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
