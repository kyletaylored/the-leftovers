import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/* -------------------------------------------------------------------------
 * Stats derivation (PRD §8.1).
 *
 * The `results` collection is hand-entered after each tournament — there is
 * no PBLeague API to pull from. Everything on /stats and the homepage stat
 * strip is derived from that collection here, so the admin only ever types
 * raw counts and never a computed figure that could drift out of sync.
 * ---------------------------------------------------------------------- */

export type PlayerStatRow = {
  slug: string;
  name: string;
  number?: number;
  role: string;
  events: number;
  gamesPlayed: number;
  eliminations: number;
  deaths: number;
  flagPulls: number;
  flagHangs: number;
  penalties: number;
  /** Eliminations per death. Deaths of 0 are treated as 1 to avoid Infinity. */
  kd: number;
  /** Eliminations per game — the fairer column when games played differ. */
  epg: number;
};

export type TeamStats = {
  rosterSize: number;
  eventCount: number;
  wins: number;
  losses: number;
  winRate: number;
  seasons: number;
  podiums: number;
  bestPlacement?: number;
};

const parseRecord = (record?: string) => {
  const m = record?.match(/^(\d+)\s*-\s*(\d+)$/);
  return m ? { wins: Number(m[1]), losses: Number(m[2]) } : { wins: 0, losses: 0 };
};

export async function getResultsWithEvents() {
  const results = await getCollection('results');
  const withEvents = await Promise.all(
    results.map(async (result) => ({
      result,
      event: await getEntry(result.data.event),
    }))
  );
  return withEvents
    .filter((r): r is { result: CollectionEntry<'results'>; event: CollectionEntry<'events'> } =>
      Boolean(r.event)
    )
    .sort((a, b) => b.event.data.startDate.getTime() - a.event.data.startDate.getTime());
}

export async function getPlayerStats(): Promise<PlayerStatRow[]> {
  const [players, results] = await Promise.all([
    getCollection('players', ({ data }) => data.status === 'active'),
    getCollection('results'),
  ]);

  const rows = new Map<string, PlayerStatRow>();
  for (const player of players) {
    rows.set(player.id, {
      slug: player.id,
      name: player.data.name,
      number: player.data.number,
      role: player.data.role,
      events: 0,
      gamesPlayed: 0,
      eliminations: 0,
      deaths: 0,
      flagPulls: 0,
      flagHangs: 0,
      penalties: 0,
      kd: 0,
      epg: 0,
    });
  }

  for (const result of results) {
    for (const line of result.data.players) {
      const row = rows.get(line.player.id);
      if (!row) continue; // stat line for a player who has since left the roster
      row.events += 1;
      row.gamesPlayed += line.gamesPlayed;
      row.eliminations += line.eliminations;
      row.deaths += line.deaths;
      row.flagPulls += line.flagPulls;
      row.flagHangs += line.flagHangs;
      row.penalties += line.penalties;
    }
  }

  for (const row of rows.values()) {
    row.kd = row.eliminations / Math.max(1, row.deaths);
    row.epg = row.gamesPlayed ? row.eliminations / row.gamesPlayed : 0;
  }

  return [...rows.values()]
    .filter((row) => row.events > 0)
    .sort((a, b) => b.eliminations - a.eliminations || b.kd - a.kd);
}

export async function getTeamStats(): Promise<TeamStats> {
  const [players, results, events] = await Promise.all([
    getCollection('players', ({ data }) => data.status === 'active'),
    getCollection('results'),
    getCollection('events'),
  ]);

  let wins = 0;
  let losses = 0;
  let podiums = 0;
  let bestPlacement: number | undefined;

  for (const result of results) {
    const record = parseRecord(result.data.record);
    wins += record.wins;
    losses += record.losses;
    const placement = result.data.placement;
    if (placement) {
      if (placement <= 3) podiums += 1;
      bestPlacement = bestPlacement ? Math.min(bestPlacement, placement) : placement;
    }
  }

  const played = events.filter((e) => e.data.startDate.getTime() <= Date.now());
  const seasons = new Set(played.map((e) => e.data.startDate.getUTCFullYear())).size;

  return {
    rosterSize: players.length,
    eventCount: played.length,
    wins,
    losses,
    winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
    seasons,
    podiums,
    bestPlacement,
  };
}
