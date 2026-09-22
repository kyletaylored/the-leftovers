/**
 * pblidb.org — a third-party, unofficial team-stats database derived from
 * public PBLeague pages (not affiliated with PBLI). Real public JSON API,
 * no auth, no hard rate limit, but they explicitly ask consumers to fetch
 * at build time and cache rather than call per-request — see their own
 * `/docs`. Every response is stamped with the disclaimer text below; render
 * it, don't drop it, since it's the whole reason this is legally simple.
 *
 * All fetches happen at Astro build time (same SSG model as the `results`/
 * `players` collections) and fail soft: a network error, timeout, or 4xx/5xx
 * returns `null`/`[]` instead of throwing, so pblidb.org being unreachable
 * never breaks the site build — the stats section just doesn't render for
 * that run. See `getTeamWidgets` for the shape a page actually renders.
 */

const BASE_URL = 'https://pblidb.org/v1';
const TIMEOUT_MS = 8000;
export const ATTRIBUTION = 'Data via pblidb.org — unofficial, not affiliated with PBLI.';

export interface PblidbTeamSummary {
  id: string;
  canonicalName: string;
  sourceTeamId: string;
}

export interface PblidbEventStats {
  eventId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
}

export interface PblidbTeamStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  byEvent: PblidbEventStats[];
}

export interface TeamWidgetData {
  team: PblidbTeamSummary;
  stats: PblidbTeamStats;
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

/** `GET /v1/teams?q=` — pblidb's own fuzzy match over team names. */
export async function searchTeams(query: string): Promise<PblidbTeamSummary[]> {
  if (!query.trim()) return [];
  const results = await pblidbFetch<PblidbTeamSummary[]>(`/teams?q=${encodeURIComponent(query)}`);
  return results ?? [];
}

export async function getTeamStats(teamId: string): Promise<PblidbTeamStats | null> {
  return pblidbFetch<PblidbTeamStats>(`/teams/${encodeURIComponent(teamId)}/stats`);
}

/**
 * Resolves a fuzzy query into one stats widget per matching team — the
 * "multiple Leftovers teams, one widget each" feature. Teams with zero
 * recorded matches are dropped: an empty widget for a team pblidb barely
 * has data on isn't useful, it just pads the page.
 */
export async function getTeamWidgets(query: string): Promise<TeamWidgetData[]> {
  const teams = await searchTeams(query);
  const withStats = await Promise.all(
    teams.map(async (team) => {
      const stats = await getTeamStats(team.id);
      return stats && stats.matchesPlayed > 0 ? { team, stats } : null;
    })
  );
  return withStats.flatMap((widget) => (widget ? [widget] : []));
}
