/**
 * The leagues that run our events, keyed by the `league` tag on an event.
 *
 * Used for the `organizer` in each SportsEvent's structured data on /events:
 * Google wants an organizer's `url`, and flags it as missing otherwise. A tag
 * with no entry here gets no organizer rather than one without a url.
 */
export const LEAGUES: Record<string, { name: string; url: string }> = {
  NXL: { name: 'NXL', url: 'https://nxlpb.com' },
};
