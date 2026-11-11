import { useEffect, useMemo, useState } from 'react';

/**
 * CountdownIsland — the only always-running island on the site (§4).
 *
 * Server-rendered with real digits so it is never blank and never shifts
 * layout (CLS budget, §10.2); the client only takes over ticking. Digits are
 * tabular so the box can't resize as the numbers change.
 *
 * Why `initialRemaining` is a prop rather than computed here: this is a
 * static site, so SSR happens at BUILD time while hydration happens whenever
 * the visitor loads the page. Deriving the first value from `Date.now()` on
 * both sides produces different text and React bails out of hydration with
 * error #418, discarding the server HTML. Taking the build-time value as a
 * serialized prop makes the first client render byte-identical to the server
 * output; the effect below then corrects it to real time on the next tick.
 *
 * The target is a calendar day, turned into an instant HERE, in the
 * browser: midnight in the visitor's own time zone (see Countdown.astro for
 * why not UTC). `localTarget` is exported for the Storybook test.
 *
 * Use the Countdown.astro wrapper, which computes that prop — don't render
 * this directly.
 */
interface CountdownProps {
  /** The day to count to, YYYY-MM-DD. */
  day: string;
  /** Count to the end of the day (midnight after it) rather than its start. */
  endOfDay?: boolean;
  /** Milliseconds remaining as of BUILD time, from Countdown.astro. */
  initialRemaining: number;
  /** Rendered once the target has passed. */
  passedLabel?: string;
}

const split = (remaining: number) => ({
  days: Math.floor(remaining / 86_400_000),
  hours: Math.floor((remaining % 86_400_000) / 3_600_000),
  minutes: Math.floor((remaining % 3_600_000) / 60_000),
  seconds: Math.floor((remaining % 60_000) / 1000),
});

const pad = (n: number) => String(n).padStart(2, '0');

/** Local midnight at the start (or end) of a YYYY-MM-DD day, in ms. */
export function localTarget(day: string, endOfDay = false): number {
  const [y, m, d] = day.split('-').map(Number);
  // new Date(y, m, d) is local time; d + 1 rolls over months and DST correctly.
  return new Date(y, m - 1, d + (endOfDay ? 1 : 0)).getTime();
}

export default function CountdownIsland({
  day,
  endOfDay = false,
  initialRemaining,
  passedLabel = "It's game day",
}: CountdownProps) {
  const targetMs = useMemo(() => localTarget(day, endOfDay), [day, endOfDay]);

  // Matches the server HTML exactly, so hydration is clean.
  const [remaining, setRemaining] = useState(initialRemaining);

  useEffect(() => {
    // Runs after hydration, so correcting to real time here is safe.
    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (remaining <= 0) {
    return <p className="font-display text-3xl uppercase text-gold-300">{passedLabel}</p>;
  }

  const parts = split(remaining);
  const units = [
    { label: 'Days', value: parts.days },
    { label: 'Hrs', value: parts.hours },
    { label: 'Min', value: parts.minutes },
    { label: 'Sec', value: parts.seconds },
  ];

  return (
    // aria-live is deliberately omitted: a clock announced every second is
    // hostile to a screen reader. The full date sits in the sibling <time>
    // element, which is the accessible source of truth.
    <div
      className="grid max-w-sm grid-cols-4 gap-1"
      role="group"
      aria-label="Time until the next event"
    >
      {units.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center border-l border-gold/30 px-2 py-1 first:border-l-0 first:pl-0"
        >
          <span className="numeral text-[clamp(1.75rem,7vw,2.5rem)] leading-none tabular-nums">
            {pad(unit.value)}
          </span>
          <span className="mt-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-bone-muted">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
