import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PlayerStatRow } from '@/lib/stats';

/**
 * StatLeaderboardTable — the one island that genuinely needs state (§4).
 *
 * Server-rendered as a complete, already-sorted HTML <table>. If JS never
 * loads the page is still a usable stats table — sorting and filtering are
 * an enhancement, not the feature.
 *
 * Sorting is driven by real <th aria-sort> buttons so it is keyboard
 * operable and announced correctly (§10.4).
 *
 * Built as a plain table rather than shadcn's <Table>: with a free-agent
 * roster this list grows without bound (see the roster note in the README),
 * so the sticky header, the horizontal scroll region and the per-column
 * mobile hiding all matter more than matching shadcn's wrapper markup.
 */
type ColumnKey = keyof Pick<
  PlayerStatRow,
  | 'name'
  | 'role'
  | 'events'
  | 'gamesPlayed'
  | 'eliminations'
  | 'deaths'
  | 'kd'
  | 'epg'
  | 'flagPulls'
  | 'flagHangs'
  | 'penalties'
>;

interface Column {
  key: ColumnKey;
  label: string;
  title: string;
  numeric: boolean;
  /** Hidden on the narrowest screens — mobile shows the columns that matter. */
  secondary?: boolean;
  format?: (row: PlayerStatRow) => string;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Player', title: 'Player name', numeric: false },
  { key: 'role', label: 'Role', title: 'Position played', numeric: false, secondary: true },
  { key: 'events', label: 'Ev', title: 'Events played', numeric: true, secondary: true },
  { key: 'gamesPlayed', label: 'GP', title: 'Games played', numeric: true },
  { key: 'eliminations', label: 'Elim', title: 'Eliminations', numeric: true },
  { key: 'deaths', label: 'Out', title: 'Times eliminated', numeric: true, secondary: true },
  {
    key: 'kd',
    label: 'E/O',
    title: 'Eliminations per elimination taken',
    numeric: true,
    format: (r) => r.kd.toFixed(2),
  },
  {
    key: 'epg',
    label: 'E/G',
    title: 'Eliminations per game',
    numeric: true,
    secondary: true,
    format: (r) => r.epg.toFixed(2),
  },
  { key: 'flagPulls', label: 'Pulls', title: 'Flag pulls', numeric: true, secondary: true },
  { key: 'flagHangs', label: 'Hangs', title: 'Flag hangs', numeric: true, secondary: true },
  { key: 'penalties', label: 'Pen', title: 'Penalties', numeric: true, secondary: true },
];

interface Props {
  rows: PlayerStatRow[];
  roles: string[];
}

export default function StatLeaderboardTable({ rows, roles }: Props) {
  const [sortKey, setSortKey] = useState<ColumnKey>('eliminations');
  const [ascending, setAscending] = useState(false);
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    const needle = query.toLowerCase().trim();
    const filtered = rows.filter(
      (row) =>
        (role === 'all' || row.role === role) &&
        (!needle || row.name.toLowerCase().includes(needle))
    );

    return [...filtered].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const compared =
        typeof left === 'string' && typeof right === 'string'
          ? left.localeCompare(right)
          : Number(left) - Number(right);
      return ascending ? compared : -compared;
    });
  }, [rows, role, query, sortKey, ascending]);

  const toggleSort = (key: ColumnKey) => {
    if (key === sortKey) {
      setAscending((prev) => !prev);
      return;
    }
    setSortKey(key);
    // Names read best A–Z; every stat reads best highest-first.
    setAscending(key === 'name' || key === 'role');
  };

  const ariaSort = (key: ColumnKey): 'ascending' | 'descending' | 'none' =>
    sortKey === key ? (ascending ? 'ascending' : 'descending') : 'none';

  const fieldClasses =
    'min-h-11 rounded-sm border border-input bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none';
  const labelClasses = 'text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-300';

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,18rem)]">
        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Filter by role</span>
          <select
            className={fieldClasses}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="all">All roles</option>
            {roles.map((roleName) => (
              <option key={roleName} value={roleName}>
                {roleName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClasses}>Search players</span>
          <input
            className={fieldClasses}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Player name"
            autoComplete="off"
          />
        </label>
      </div>

      <div
        className="overflow-x-auto rounded-sm border border-border bg-card"
        tabIndex={0}
        role="region"
        aria-label="Player statistics, scrollable"
      >
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Career tournament statistics per player, sortable by column. Currently sorted by{' '}
            {COLUMNS.find((column) => column.key === sortKey)?.title}{' '}
            {ascending ? 'ascending' : 'descending'}.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-0 border-b border-border bg-ink-900 py-3 pl-3.5 pr-2 text-left text-[0.65rem] font-bold tracking-[0.16em] text-bone-muted"
                aria-label="Rank"
              >
                #
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={ariaSort(column.key)}
                  className={cn(
                    'sticky top-0 whitespace-nowrap border-b border-border bg-ink-900 p-0 text-left',
                    column.secondary && 'max-md:hidden'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    title={`Sort by ${column.title}`}
                    className={cn(
                      'inline-flex min-h-11 w-full items-center gap-1.5 px-2.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-foreground hover:text-gold-300',
                      column.numeric && 'justify-end'
                    )}
                  >
                    <span>{column.label}</span>
                    <span className="text-[0.7em] text-gold" aria-hidden="true">
                      {sortKey === column.key ? (ascending ? '▲' : '▼') : '⇅'}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr
                key={row.slug}
                className={cn(
                  'border-b border-border/60 last:border-b-0 hover:bg-muted',
                  // Solid gold leading row, per the UI component sheet.
                  index === 0 && 'bg-gold text-ink hover:bg-gold'
                )}
              >
                <td
                  className={cn(
                    'py-2.5 pl-3.5 pr-2 tabular-nums',
                    index === 0 ? 'font-bold text-ink' : 'text-bone-muted'
                  )}
                >
                  {index + 1}
                </td>
                {COLUMNS.map((column) =>
                  column.key === 'name' ? (
                    <th
                      key={column.key}
                      scope="row"
                      className={cn(
                        'whitespace-nowrap p-2.5 text-left font-semibold',
                        index === 0 ? 'text-ink' : 'text-foreground'
                      )}
                    >
                      {/* The flex layout lives on an inner span: changing a
                          <th>'s `display` can strip its table-cell role. */}
                      <span className="flex items-center gap-2.5">
                        {row.number !== undefined && (
                          <span
                            className={cn(
                              'min-w-7 text-right text-xl leading-none',
                              // The ribbed gold treatment would vanish on a
                              // gold row, so the leader gets flat ink digits.
                              index === 0 ? 'font-display font-bold text-ink' : 'numeral'
                            )}
                          >
                            {row.number}
                          </span>
                        )}
                        <span>{row.name}</span>
                      </span>
                    </th>
                  ) : (
                    <td
                      key={column.key}
                      className={cn(
                        'p-2.5',
                        column.numeric && 'text-right tabular-nums',
                        column.secondary && 'max-md:hidden',
                        index === 0 ? 'text-ink' : 'text-bone-muted'
                      )}
                    >
                      {column.format ? column.format(row) : row[column.key]}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-bone-muted">
            No players match that filter.
          </p>
        )}
      </div>

      <p className="mt-3.5 text-xs leading-relaxed text-bone-muted">
        Stat lines are entered by hand after each tournament — there is no public PBLeague feed to
        pull from. Spot something wrong? Tell the captain and it gets fixed.
      </p>
    </div>
  );
}
