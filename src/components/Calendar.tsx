import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Calendar — a real month-grid view of the schedule, added per the Oct 2026
 * follow-up to the design-handoff audit (added to the Storybook §04 as a
 * reference too — see the "Calendar" section there).
 *
 * The events page already listed upcoming/past as cards; this gives a
 * visitor the "what does the season actually look like" view a list can't:
 * event days marked on a real month grid, with month navigation.
 *
 * Server-rendered with the correct starting month (the month of the next
 * upcoming event, or today if none) so it's never blank before hydration —
 * same SSR-first pattern as Countdown. Day cells with an event are real
 * `<a href="#slug">` anchors that work with zero JS (they jump to the
 * matching EventCard below); only the month-to-month navigation needs the
 * island.
 */
export interface CalendarEvent {
  slug: string;
  title: string;
  /** ISO date strings — plain, serializable, no Date objects across the
   *  server/client boundary. */
  startDate: string;
  endDate: string;
  upcoming: boolean;
}

interface CalendarProps {
  events: CalendarEvent[];
  /** ISO date (yyyy-mm-dd) for the month to open on. */
  initialMonth: string;
  className?: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** All calendar dates use UTC — the events collection stores date-only
 *  values, which parse to UTC midnight (see lib/format.ts for the same
 *  rule applied elsewhere on this site). Using the local timezone here
 *  would shift a day for anyone west of Greenwich. */
function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();

  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, iso: ymd(year, month, day) });
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Calendar({ events, initialMonth, className }: CalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const [y, m] = initialMonth.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Map each date-in-range to the events covering it (multi-day events mark
  // every day from startDate to endDate, inclusive).
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const start = new Date(`${event.startDate}T00:00:00Z`);
      const end = new Date(`${event.endDate}T00:00:00Z`);
      for (let t = start.getTime(); t <= end.getTime(); t += 86_400_000) {
        const iso = new Date(t).toISOString().slice(0, 10);
        const list = map.get(iso) ?? [];
        list.push(event);
        map.set(iso, list);
      }
    }
    return map;
  }, [events]);

  const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);

  const goToMonth = (delta: number) =>
    setCursor((prev) => {
      const next = new Date(Date.UTC(prev.year, prev.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });

  return (
    <div className={cn('rounded-sm border border-ink-600 bg-ink-800 p-4 sm:p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          aria-label="Previous month"
          className="tap inline-flex size-11 items-center justify-center rounded-sm border border-ink-600 text-bone-muted transition-colors hover:border-gold hover:text-gold-300"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <p className="font-display text-lg uppercase text-bone sm:text-xl" aria-live="polite">
          {MONTH_NAMES[cursor.month]} {cursor.year}
        </p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className="tap inline-flex size-11 items-center justify-center rounded-sm border border-ink-600 text-bone-muted transition-colors hover:border-gold hover:text-gold-300"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-bone-muted">
            {d}
          </span>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <span key={i} aria-hidden="true" />;
          const dayEvents = eventsByDay.get(cell.iso) ?? [];
          const hasEvent = dayEvents.length > 0;
          const isToday = cell.iso === todayIso;
          const primary = dayEvents[0];

          const content = (
            <span
              className={cn(
                'flex aspect-square w-full flex-col items-center justify-center rounded-sm text-sm transition-colors',
                hasEvent
                  ? primary?.upcoming
                    ? 'border border-gold bg-gold/10 font-bold text-gold-300 hover:bg-gold hover:text-ink'
                    : 'border border-ink-600 bg-ink-900 text-bone-muted hover:border-gold/50'
                  : 'text-bone-muted',
                isToday && !hasEvent && 'ring-1 ring-gold/50'
              )}
            >
              {cell.day}
              {hasEvent && (
                <span
                  className={cn(
                    'mt-0.5 size-1.5 rounded-full',
                    primary?.upcoming ? 'bg-gold' : 'bg-bone-muted'
                  )}
                  aria-hidden="true"
                />
              )}
            </span>
          );

          return (
            <div key={i} className="tap">
              {hasEvent ? (
                <a
                  href={`#${primary.slug}`}
                  aria-label={`${cell.day}: ${dayEvents.map((e) => e.title).join(', ')}`}
                  className="block"
                >
                  {content}
                </a>
              ) : (
                <span aria-hidden={!isToday}>{content}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-bone-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" /> Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-bone-muted" aria-hidden="true" /> Played
        </span>
      </div>
    </div>
  );
}
