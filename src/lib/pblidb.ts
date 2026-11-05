/**
 * pblidb.org (PBL Stats) — a third-party, unofficial stats database derived
 * from public PBLeague pages, not affiliated with PBLI. Public JSON API, no
 * auth. It asks static sites to fetch at build time and cache, which is why
 * this isn't the browser widget. The data refreshes about weekly.
 *
 * One build-time call, and it fails soft: a network error, timeout or 4xx/5xx
 * returns [] so pblidb.org being unreachable never breaks the site build.
 *
 * Two filters matter, both in `getTeamWidgets`:
 *  - OUR_TEAMS, because a search for "leftovers" also finds unrelated teams.
 *    It's keyed on `sourceTeamId`, not `id`: slugs with a number on the end
 *    (`the-leftovers-5`) can change between refreshes.
 *  - Decided results, not `matchesPlayed`. That count includes matches pblidb
 *    has no result for yet, and a card reading "0-0, 58 matches" misleads.
 *
 * The list lives here rather than in site.yml because it isn't in .pages.yml,
 * so a CMS save of Site settings could drop it.
 */

const BASE_URL = 'https://pblidb.org/v1';
const TIMEOUT_MS = 8000;
const TEAM_QUERY = 'leftovers';
export const ATTRIBUTION = 'Data via PBL Stats (pblidb.org). Unofficial, not affiliated with PBLI.';

/**
 * Left out on purpose: Dynamic Leftovers, Leftovers (Open 3v3) and THE
 * LEFTOVERS (Portugal Open). pblidb splits the main team into four empty
 * records, so all four are listed until it's clear which are ours.
 */
const OUR_TEAMS = new Set([
  'LxgIo5LPaqVNPuku', // The Leftovers
  'eOnEgoLcO0JMTXP0', // The Leftovers
  'HFg6YKCb2wETwcro', // The Leftovers
  'vBF7C4LnYzNnbxwC', // The Leftovers
  'INFWOMAJMpLZasFj', // The Leftovers 10v10
  'PCOSr0KmbpAFNzjm', // The Leftovers 3-Man
  'LiB1Gpa4Sv1qak3v', // The Leftovers AM
  '5FDJWUUpH21YlIME', // The Leftovers AM II
  '4JFWOnM6wQRydvxv', // The Leftovers I
  'wHXha72N1R66VyDA', // The Leftovers I.5
  'WwNOkn7W3MpvQAW4', // The Leftovers II
  'VKarJUbVYj24cVL1', // The Leftovers II.5
  'Vs5AJMp9au763iam', // The Leftovers III
  'a6PiaoddRvu1nLbd', // The Leftovers III.5
  'bAfMtRuQ2CvQ7Im6', // The Leftovers INTERM
  'c47UfA2etI0gEVyP', // The Leftovers IV
  'oPSJGyDLVyByNWZY', // The Leftovers IV.5
  'PRlX8AYApieGQuFm', // The Leftovers Kidz
  '9iTfSEoYiJ4Js89W', // The Leftovers Ladies
  'ZnYfxjtmKt5YgYDO', // The Leftovers NOV
  'V6afYioxALcu5Rax', // The Leftovers NOV II
  'rCF6SLYslo0UIrMS', // The Leftovers NOV III
  'cu3RtBfIabCn2Yqo', // The Leftovers NOV IV
  '06HfZPdqkBftZccs', // The Leftovers NOV V
  'iG64QxBdbNlJHb8N', // The Leftovers OG
  '7ceoL4yiwwbLd1uE', // The Leftovers OG II
  'H7EmTALkNlPvTIAe', // The Leftovers OG III
  'UU2qrX8nVqNjYzxb', // The Leftovers V
  'nk4C3N0Uno37NBPD', // The Leftovers VI
]);

export interface PblidbTeamSummary {
  id: string;
  canonicalName: string;
  sourceTeamId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  scheduled: number;
  events: number;
  lastPlayed: string | null;
  lastEventName: string | null;
}

async function pblidbFetch<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: T };
    return body.data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Wins, losses and ties: the matches pblidb actually has a result for. */
export const decidedMatches = (team: PblidbTeamSummary) => team.wins + team.losses + team.ties;

/** Our teams with at least one known result, most matches first. */
export async function getTeamWidgets(): Promise<PblidbTeamSummary[]> {
  const data = await pblidbFetch<{ teams: PblidbTeamSummary[] }>(
    `/team-summaries?q=${TEAM_QUERY}&limit=200`
  );
  return (data?.teams ?? []).filter(
    (team) => OUR_TEAMS.has(team.sourceTeamId) && decidedMatches(team) > 0
  );
}
