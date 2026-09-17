<script lang="ts">
  /**
   * StatLeaderboardTable — the one island that genuinely needs state (§4),
   * which is why Svelte is in the stack at all: it compiles to a few KB of
   * plain JS with no client runtime, so the rest of the site stays at zero.
   *
   * Server-rendered as a complete, already-sorted HTML <table>. If JS never
   * loads the page is still a usable stats table — sorting and filtering are
   * an enhancement, not the feature.
   *
   * Sorting is driven by real <th aria-sort> buttons so it is keyboard
   * operable and announced correctly (§10.4).
   */
  import type { PlayerStatRow } from '../lib/stats';

  interface Props {
    rows: PlayerStatRow[];
    roles: string[];
  }
  let { rows, roles }: Props = $props();

  type ColumnKey = keyof Pick<
    PlayerStatRow,
    'name' | 'role' | 'events' | 'gamesPlayed' | 'eliminations' | 'deaths' | 'kd' | 'epg' | 'flagPulls' | 'flagHangs' | 'penalties'
  >;

  const columns: Array<{
    key: ColumnKey;
    label: string;
    title: string;
    numeric: boolean;
    /** Hidden on the narrowest screens — mobile shows the columns that matter. */
    secondary?: boolean;
    format?: (row: PlayerStatRow) => string;
  }> = [
    { key: 'name', label: 'Player', title: 'Player name', numeric: false },
    { key: 'role', label: 'Role', title: 'Position played', numeric: false, secondary: true },
    { key: 'events', label: 'Ev', title: 'Events played', numeric: true, secondary: true },
    { key: 'gamesPlayed', label: 'GP', title: 'Games played', numeric: true },
    { key: 'eliminations', label: 'Elim', title: 'Eliminations', numeric: true },
    { key: 'deaths', label: 'Out', title: 'Times eliminated', numeric: true, secondary: true },
    { key: 'kd', label: 'E/O', title: 'Eliminations per elimination taken', numeric: true, format: (r) => r.kd.toFixed(2) },
    { key: 'epg', label: 'E/G', title: 'Eliminations per game', numeric: true, secondary: true, format: (r) => r.epg.toFixed(2) },
    { key: 'flagPulls', label: 'Pulls', title: 'Flag pulls', numeric: true, secondary: true },
    { key: 'flagHangs', label: 'Hangs', title: 'Flag hangs', numeric: true, secondary: true },
    { key: 'penalties', label: 'Pen', title: 'Penalties', numeric: true, secondary: true },
  ];

  let sortKey = $state<ColumnKey>('eliminations');
  let ascending = $state(false);
  let role = $state('all');
  let query = $state('');

  const sorted = $derived.by(() => {
    const filtered = rows.filter((row) => {
      const matchesRole = role === 'all' || row.role === role;
      const matchesQuery = !query || row.name.toLowerCase().includes(query.toLowerCase().trim());
      return matchesRole && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const compared =
        typeof left === 'string' && typeof right === 'string'
          ? left.localeCompare(right)
          : Number(left) - Number(right);
      return ascending ? compared : -compared;
    });
  });

  function toggleSort(key: ColumnKey) {
    if (sortKey === key) {
      ascending = !ascending;
    } else {
      sortKey = key;
      // Names read best A–Z; every stat reads best highest-first.
      ascending = key === 'name' || key === 'role';
    }
  }

  const ariaSort = (key: ColumnKey) =>
    sortKey === key ? (ascending ? 'ascending' : 'descending') : 'none';
</script>

<div class="wrap">
  <div class="controls">
    <label class="field">
      <span>Filter by role</span>
      <select bind:value={role}>
        <option value="all">All roles</option>
        {#each roles as roleName (roleName)}
          <option value={roleName}>{roleName}</option>
        {/each}
      </select>
    </label>

    <label class="field">
      <span>Search players</span>
      <input type="search" bind:value={query} placeholder="Player name" autocomplete="off" />
    </label>
  </div>

  <div class="scroll" tabindex="0" role="region" aria-label="Player statistics, scrollable">
    <table>
      <caption class="sr-only">
        Career tournament statistics per player, sortable by column. Currently sorted by
        {columns.find((c) => c.key === sortKey)?.title} {ascending ? 'ascending' : 'descending'}.
      </caption>
      <thead>
        <tr>
          <th scope="col" class="rank" aria-label="Rank">#</th>
          {#each columns as column (column.key)}
            <th
              scope="col"
              aria-sort={ariaSort(column.key)}
              class:numeric={column.numeric}
              class:secondary={column.secondary}
            >
              <button type="button" onclick={() => toggleSort(column.key)} title={`Sort by ${column.title}`}>
                <span>{column.label}</span>
                <span class="arrow" aria-hidden="true">
                  {sortKey === column.key ? (ascending ? '▲' : '▼') : '⇅'}
                </span>
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sorted as row, index (row.slug)}
          <tr class:leader={index === 0}>
            <td class="rank">{index + 1}</td>
            {#each columns as column (column.key)}
              {#if column.key === 'name'}
                <!-- The flex layout lives on an inner span: changing a <th>'s
                     `display` can strip its table-cell role in some browsers. -->
                <th scope="row" class="player">
                  <span class="player-inner">
                    {#if row.number !== undefined}<span class="jersey numeral">{row.number}</span>{/if}
                    <span>{row.name}</span>
                  </span>
                </th>
              {:else}
                <td class:numeric={column.numeric} class:secondary={column.secondary}>
                  {column.format ? column.format(row) : row[column.key]}
                </td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>

    {#if sorted.length === 0}
      <p class="empty">No players match that filter.</p>
    {/if}
  </div>

  <p class="footnote">
    Stat lines are entered by hand after each tournament — there is no public PBLeague feed to pull
    from. Spot something wrong? Tell the captain and it gets fixed.
  </p>
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .controls {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  @media (min-width: 640px) {
    .controls {
      grid-template-columns: minmax(0, 14rem) minmax(0, 18rem);
    }
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .field span {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-gold-300);
  }
  .field select,
  .field input {
    min-height: 44px;
    padding: 0 0.75rem;
    border: 1px solid var(--color-ink-600);
    border-radius: 2px;
    background: var(--color-ink-800);
    color: var(--color-bone);
    font: inherit;
    font-size: 0.9rem;
  }

  .scroll {
    overflow-x: auto;
    border: 1px solid var(--color-ink-600);
    border-radius: 2px;
    background: var(--color-ink-800);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  thead th {
    position: sticky;
    top: 0;
    background: var(--color-ink-900);
    border-bottom: 1px solid var(--color-ink-600);
    padding: 0;
    text-align: left;
    white-space: nowrap;
  }
  thead th.rank {
    padding: 0.75rem 0.5rem 0.75rem 0.85rem;
    font-size: 0.65rem;
    letter-spacing: 0.16em;
    color: var(--color-bone-muted);
    font-weight: 700;
  }
  thead button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    width: 100%;
    min-height: 44px;
    padding: 0 0.7rem;
    background: none;
    border: 0;
    color: var(--color-bone);
    font: inherit;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
  }
  thead button:hover {
    color: var(--color-gold-300);
  }
  .arrow {
    color: var(--color-gold);
    font-size: 0.7em;
  }

  tbody tr {
    border-bottom: 1px solid color-mix(in srgb, var(--color-ink-600) 60%, transparent);
  }
  tbody tr:last-child {
    border-bottom: 0;
  }
  tbody tr:hover {
    background: var(--color-ink-700);
  }

  /* Gold highlight on the top row, as in the stats mockup. */
  tbody tr.leader {
    background: color-mix(in srgb, var(--color-gold) 12%, transparent);
    box-shadow: inset 3px 0 0 var(--color-gold);
  }

  td,
  tbody th {
    padding: 0.7rem;
    color: var(--color-bone-muted);
    text-align: left;
    font-weight: 400;
  }
  .numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  thead th.numeric button {
    justify-content: flex-end;
  }
  .rank {
    padding-left: 0.85rem;
    color: var(--color-bone-muted);
    font-variant-numeric: tabular-nums;
  }
  .player {
    color: var(--color-bone);
    font-weight: 600;
    white-space: nowrap;
  }
  .player-inner {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .jersey {
    font-size: 1.25rem;
    line-height: 1;
    min-width: 1.6rem;
    text-align: right;
  }

  /* Mobile: hide the long tail of columns rather than squeezing 11 of them. */
  @media (max-width: 767px) {
    .secondary {
      display: none;
    }
  }

  .empty {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-bone-muted);
    font-size: 0.875rem;
  }

  .footnote {
    margin-top: 0.85rem;
    font-size: 0.75rem;
    line-height: 1.6;
    color: var(--color-bone-muted);
  }
</style>
