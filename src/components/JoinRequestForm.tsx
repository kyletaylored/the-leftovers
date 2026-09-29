import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * JoinRequestForm — "I want to play [event] with you." Replaces asking in a
 * Discord channel that doesn't exist right now: this is the one place a
 * free agent tells us who they are, what event they want, what they play,
 * and how they'll pay once a spot is confirmed.
 *
 * Same two-mode pattern as `PreorderForm.tsx` — see that file's comment for
 * the full rationale. Short version: with no `endpoint` configured
 * (`handoff` mode, the default) the form formats the request and hands it
 * to the requester to email or paste themselves. Point `endpoint` at a
 * Google Form's `formResponse` URL with `provider: 'google-form'` and a
 * `fieldMap` to collect requests straight into a Sheet instead — see
 * `site.yml`'s `join` block.
 *
 * Deliberately does NOT try to confirm anyone or record payment status —
 * that's a manual step once a request lands (Google Sheet columns, or
 * whatever the team decides), not something a static site can do.
 */

export interface JoinEventOption {
  id: string;
  label: string;
}

export interface PaymentMethod {
  label: string;
  handle?: string;
}

interface JoinRequestFormProps {
  events: JoinEventOption[];
  paymentMethods: PaymentMethod[];
  /** Optional submit endpoint. Empty = `handoff` mode (the default). */
  endpoint?: string;
  /** `google-form` switches to Google's entry.NNN encoding. */
  provider?: string;
  /** Our field name -> the form's entry.NNN id. */
  fieldMap?: Record<string, string>;
  /** Where a handoff-mode request is emailed. */
  teamEmail: string;
}

const MIN_FILL_MS = 3000;

/**
 * Player class ("what you are") and division ("what you want to play") are
 * two separate PBLeagues concepts, not one — a player can play up a
 * division, so it's asked separately rather than derived from class. Both
 * now draw from the same D6-through-Pro list rather than a separate
 * skill-class list, since that's what the backing Google Form uses.
 */
const DIVISIONS = ['D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'Semi-Pro', 'Pro'];

/** Format of the specific event/team they're asking about. */
const TEAM_SIZES = ['Any size', '3-man', '5-man', '7-man', '10-man', 'X-Ball'];

/**
 * Broad territory, not a full country list — see `docs/JOIN.md`. United
 * States gets its own option since that's where most events run; AMER
 * covers the rest of the Americas.
 */
const REGIONS = ['United States', 'AMER', 'EMEA', 'APAC'];

const field = 'field-input';
const label = 'field-label';

export default function JoinRequestForm({
  events,
  paymentMethods,
  endpoint,
  provider,
  fieldMap = {},
  teamEmail,
}: JoinRequestFormProps) {
  const mountedAt = useRef(Date.now());
  const [state, setState] = useState<'idle' | 'sending' | 'review' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  function buildSummary(data: FormData) {
    const get = (key: string) => String(data.get(key) ?? '').trim();
    const eventLabel =
      events.find((e) => e.id === get('event'))?.label || get('event') || 'Not specified';

    return [
      'Join request — The Leftovers',
      '',
      `Event: ${eventLabel}`,
      `Division: ${get('division') || 'Not specified'}`,
      `Team size / format: ${get('teamSize') || 'Not specified'}`,
      '',
      `Name:  ${get('firstName')} ${get('lastName')}`.trim(),
      `Player class: ${get('playerClass') || 'Not specified'}`,
      `Country: ${get('country') || 'Not specified'}`,
      `Email: ${get('email')}`,
      ...(get('phone') ? [`Phone: ${get('phone')}`] : []),
      '',
      ...(get('paymentMethod') ? [`Preferred payment: ${get('paymentMethod')}`] : []),
      ...(get('notes') ? [`Notes: ${get('notes')}`] : []),
    ].join('\n');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot: a real person never sees or fills this.
    if (data.get('company')) return;
    if (Date.now() - mountedAt.current < MIN_FILL_MS) {
      setError('That was quick — give it a moment and try again.');
      setState('error');
      return;
    }

    const text = buildSummary(data);
    setSummary(text);
    setError(undefined);

    if (!endpoint) {
      setState('review');
      return;
    }

    setState('sending');

    if (provider === 'google-form') {
      const entry = (name: string) => fieldMap[name];
      const params = new URLSearchParams();
      const put = (name: string, value: string) => {
        const id = entry(name);
        if (id && value) params.set(id, value);
      };

      const eventLabel =
        events.find((e) => e.id === String(data.get('event') ?? ''))?.label ||
        String(data.get('event') ?? '');

      put('firstName', String(data.get('firstName') ?? '').trim());
      put('lastName', String(data.get('lastName') ?? '').trim());
      put('playerClass', String(data.get('playerClass') ?? '').trim());
      put('country', String(data.get('country') ?? '').trim());
      put('email', String(data.get('email') ?? '').trim());
      put('phone', String(data.get('phone') ?? '').trim());
      put('event', eventLabel);
      put('division', String(data.get('division') ?? '').trim());
      put('teamSize', String(data.get('teamSize') ?? '').trim());
      put('paymentMethod', String(data.get('paymentMethod') ?? '').trim());
      put('notes', String(data.get('notes') ?? '').trim());

      try {
        // Google serves no CORS headers on `formResponse`, so this is
        // necessarily `mode: 'no-cors'` — the request goes out and the
        // response is opaque. The confirmation screen still shows the
        // request text, so a silent failure costs the requester nothing.
        await fetch(endpoint, { method: 'POST', mode: 'no-cors', body: params });
        setState('done');
      } catch {
        setState('review');
        setError(
          'Couldn’t send that automatically — here’s your request to send across instead.'
        );
      }
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Submission failed (${response.status})`);
      setState('done');
    } catch {
      setState('review');
      setError(
        'Couldn’t send that automatically — here’s your request to send across instead.'
      );
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const mailtoHref = `mailto:${teamEmail}?subject=${encodeURIComponent(
    'Join request'
  )}&body=${encodeURIComponent(summary)}`;

  const nextSteps = (
    <>
      {paymentMethods.length > 0 && (
        <div className="mt-5 border-l-2 border-gold pl-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-300">
            Once you're confirmed, send payment via
          </p>
          <ul className="mt-2 space-y-1 text-sm text-bone">
            {paymentMethods.map((method) => (
              <li key={method.label}>
                {method.label}
                {method.handle && <span className="text-bone-muted"> — {method.handle}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-5 text-sm leading-relaxed text-bone-muted">
        <strong className="text-bone">Your spot isn&rsquo;t held until we confirm you and
        payment arrives.</strong>{' '}
        We&rsquo;ll follow up by email. If you don&rsquo;t hear back within a day or two, chase
        us — it means something went wrong, not that you&rsquo;re in.
      </p>
    </>
  );

  if (state === 'review') {
    return (
      <div className="rounded-sm border border-gold/60 bg-ink-800 p-6 sm:p-8" role="status" aria-live="polite">
        <h3 className="font-display text-2xl uppercase text-bone">Your request is ready to send</h3>
        <p className="mt-3 text-sm leading-relaxed text-bone-muted">
          Email it across or paste it wherever you normally reach us. Nothing has been sent
          automatically.
        </p>

        {error && (
          <p className="mt-3 text-sm text-crimson-400" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="join-summary" className={cn(label, 'mt-6')}>
          Your request
        </label>
        <textarea
          id="join-summary"
          readOnly
          rows={Math.min(20, summary.split('\n').length + 1)}
          value={summary}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-sm border border-input bg-ink-900 p-3 font-mono text-xs leading-relaxed text-bone"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={mailtoHref}
            className="inline-flex min-h-11 items-center rounded-sm bg-crimson px-6 text-xs font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:bg-crimson-600"
          >
            Email this request
          </a>
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex min-h-11 items-center rounded-sm border border-gold px-6 text-xs font-bold uppercase tracking-[0.14em] text-gold-300 transition-colors hover:bg-gold hover:text-ink"
          >
            {copied ? 'Copied' : 'Copy to clipboard'}
          </button>
          <button
            type="button"
            onClick={() => setState('idle')}
            className="inline-flex min-h-11 items-center px-2 text-xs font-bold uppercase tracking-[0.14em] text-bone-muted hover:text-bone"
          >
            Edit request
          </button>
        </div>

        {nextSteps}
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className="rounded-sm border border-gold/60 bg-ink-800 p-6 sm:p-8" role="status" aria-live="polite">
        <h3 className="font-display text-2xl uppercase text-bone">Request received</h3>
        <p className="mt-3 text-sm leading-relaxed text-bone-muted">
          We'll follow up by email once we've had a chance to look at the roster.
        </p>

        <details className="mt-5">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.14em] text-gold-300">
            Your request, for your records
          </summary>
          <textarea
            readOnly
            rows={Math.min(20, summary.split('\n').length + 1)}
            value={summary}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-3 w-full rounded-sm border border-input bg-ink-900 p-3 font-mono text-xs leading-relaxed text-bone"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={mailtoHref}
              className="inline-flex min-h-11 items-center rounded-sm border border-gold px-5 text-xs font-bold uppercase tracking-[0.14em] text-gold-300 transition-colors hover:bg-gold hover:text-ink"
            >
              Email a copy
            </a>
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex min-h-11 items-center px-2 text-xs font-bold uppercase tracking-[0.14em] text-bone-muted hover:text-bone"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </details>

        {nextSteps}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Honeypot. Off-screen rather than display:none, which some bots skip. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className="font-display text-xl uppercase text-bone">Who you are</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              className={field}
              type="text"
              required
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className={label} htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              className={field}
              type="text"
              required
              autoComplete="family-name"
            />
          </div>
          <div>
            <label className={label} htmlFor="email">
              Email
            </label>
            <input id="email" name="email" className={field} type="email" required autoComplete="email" />
          </div>
          <div>
            <label className={label} htmlFor="phone">
              Phone <span className="text-bone-muted">(optional)</span>
            </label>
            <input id="phone" name="phone" className={field} type="tel" autoComplete="tel" />
          </div>
          <div>
            <label className={label} htmlFor="playerClass">
              Player class
            </label>
            <select id="playerClass" name="playerClass" className={field} required defaultValue="">
              <option value="" disabled>
                Choose one…
              </option>
              {DIVISIONS.map((playerClass) => (
                <option key={playerClass} value={playerClass}>
                  {playerClass}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="country">
              Country
            </label>
            <select id="country" name="country" className={field} required defaultValue="">
              <option value="" disabled>
                Choose one…
              </option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl uppercase text-bone">What you want to play</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="event">
              Event
            </label>
            <select id="event" name="event" className={field} required defaultValue="">
              <option value="" disabled>
                Choose an event…
              </option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
              <option value="not-sure">Not sure yet / general interest</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="division">
              Division
            </label>
            <select id="division" name="division" className={field} required defaultValue="">
              <option value="" disabled>
                Choose one…
              </option>
              {DIVISIONS.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="teamSize">
              Team size / format
            </label>
            <select id="teamSize" name="teamSize" className={field} required defaultValue="">
              <option value="" disabled>
                Choose one…
              </option>
              {TEAM_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl uppercase text-bone">Paying once you're in</legend>
        <p className="mt-1 text-sm text-bone-muted">
          Payment is arranged directly with the captain once your spot is confirmed — nothing is
          charged here.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {paymentMethods.length > 0 && (
            <div>
              <label className={label} htmlFor="paymentMethod">
                Preferred method
              </label>
              <select id="paymentMethod" name="paymentMethod" className={field} required defaultValue="">
                <option value="" disabled>
                  Choose one…
                </option>
                {paymentMethods.map((method) => (
                  <option key={method.label} value={method.label}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={paymentMethods.length > 0 ? '' : 'sm:col-span-2'}>
            <label className={label} htmlFor="notes">
              Notes <span className="text-bone-muted">(optional)</span>
            </label>
            <input id="notes" name="notes" className={field} type="text" />
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-bone-muted">
          <input
            type="checkbox"
            name="acknowledged"
            required
            value="yes"
            className="mt-1 size-4 shrink-0 accent-gold"
          />
          <span>
            I understand my spot isn&rsquo;t confirmed until the captain confirms me and payment
            is received.
          </span>
        </label>
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-ink-600 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="min-h-11 rounded-sm bg-crimson px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:bg-crimson-600 disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending…' : 'Send join request'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-crimson-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
