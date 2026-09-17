import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * PreorderForm — collects order requests for a drop.
 *
 * Replaces "reply in the comments on a Facebook post". The thing that process
 * actually gets wrong isn't data entry, it's certainty: nobody can tell
 * whether their order was counted, what they owe, or who to pay. So the form
 * is built around removing that ambiguity — a running total as you go, and a
 * confirmation screen that states the amount, the payment handles, and in
 * plain words that a spot is not held until payment arrives.
 *
 * Posts as a normal form submission to whatever endpoint site settings give
 * it (§4's pattern: no backend of our own, no PII through our infrastructure).
 * See docs/PREORDERS.md for the two supported backends.
 *
 * Bot protection without a server: a honeypot field real users never see, and
 * a minimum fill time — a bot that posts in under three seconds is rejected
 * client-side. When a Turnstile site key is configured the widget renders too,
 * which only becomes real protection once an endpoint verifies the token
 * server-side (again: docs/PREORDERS.md).
 */

export interface Variant {
  name: string;
  description?: string;
}

export interface PaymentMethod {
  label: string;
  handle?: string;
}

interface PreorderFormProps {
  campaign: string;
  variants: Variant[];
  sizes: string[];
  price: number;
  currency: string;
  nameOnBack: boolean;
  numberOnBack: boolean;
  paymentMethods: PaymentMethod[];
  /** Form relay endpoint. Empty renders the fallback notice instead. */
  endpoint: string;
  /** Optional Turnstile site key. */
  turnstileSiteKey?: string;
  maxJerseys?: number;
}

interface JerseyRow {
  id: number;
  variant: string;
  size: string;
  nameOnBack: string;
  numberOnBack: string;
}

const MIN_FILL_MS = 3000;

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

const field =
  'w-full min-h-11 rounded-sm border border-input bg-ink-900 px-3 py-2 text-sm text-foreground placeholder:text-bone-muted/60 focus:border-ring focus:outline-none';
const label = 'mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-300';

export default function PreorderForm({
  campaign,
  variants,
  sizes,
  price,
  currency,
  nameOnBack,
  numberOnBack,
  paymentMethods,
  endpoint,
  turnstileSiteKey,
  maxJerseys = 6,
}: PreorderFormProps) {
  const mountedAt = useRef(Date.now());
  const [rows, setRows] = useState<JerseyRow[]>([
    { id: 1, variant: variants[0]?.name ?? '', size: '', nameOnBack: '', numberOnBack: '' },
  ]);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string>();

  const total = useMemo(() => rows.length * price, [rows.length, price]);

  const updateRow = (id: number, patch: Partial<JerseyRow>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () =>
    setRows((prev) =>
      prev.length >= maxJerseys
        ? prev
        : [
            ...prev,
            {
              id: Math.max(...prev.map((r) => r.id)) + 1,
              variant: variants[0]?.name ?? '',
              size: '',
              nameOnBack: '',
              numberOnBack: '',
            },
          ]
    );

  const removeRow = (id: number) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));

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

    // Flatten the jersey rows into readable lines, because the person reading
    // this is the captain in an email, not a database.
    data.delete('company');
    data.set('campaign', campaign);
    data.set('jerseyCount', String(rows.length));
    data.set('orderTotal', money(total, currency));
    data.set(
      'jerseys',
      rows
        .map((row, index) => {
          const parts = [`#${index + 1}`, row.variant, `size ${row.size}`];
          if (nameOnBack && row.nameOnBack) parts.push(`name "${row.nameOnBack}"`);
          if (numberOnBack && row.numberOnBack) parts.push(`number ${row.numberOnBack}`);
          return parts.join(' · ');
        })
        .join('\n')
    );

    setState('sending');
    setError(undefined);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Submission failed (${response.status})`);
      setState('done');
    } catch {
      setState('error');
      setError(
        'That didn’t go through. Try again, or message the captain directly and we’ll take it down manually.'
      );
    }
  }

  if (!endpoint) {
    return (
      <div className="rounded-sm border border-dashed border-gold/50 bg-ink-800/60 p-6">
        <h3 className="font-display text-xl uppercase text-bone">Order form not connected</h3>
        <p className="mt-2 text-sm leading-relaxed text-bone-muted">
          Set <code className="text-gold-300">preorderForm.endpoint</code> in site settings to start
          taking orders. Until then, orders still go through the Facebook post — see
          docs/PREORDERS.md for the two ways to wire this up.
        </p>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div
        className="rounded-sm border border-gold/60 bg-ink-800 p-6 sm:p-8"
        role="status"
        aria-live="polite"
      >
        <h3 className="font-display text-2xl uppercase text-bone">Order received</h3>
        <p className="mt-3 text-sm leading-relaxed text-bone-muted">
          {rows.length} {rows.length === 1 ? 'jersey' : 'jerseys'} — total{' '}
          <strong className="text-bone">{money(total, currency)}</strong>.
        </p>

        {paymentMethods.length > 0 && (
          <div className="mt-5 border-l-2 border-gold pl-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-300">
              Send payment via
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

        {/* The single most important sentence on the page. */}
        <p className="mt-5 text-sm leading-relaxed text-bone-muted">
          <strong className="text-bone">Your spot isn&rsquo;t held until payment arrives.</strong>{' '}
          We&rsquo;ll confirm by email once it does. If you don&rsquo;t hear back within a day or
          two, chase us — it means something went wrong, not that you&rsquo;re in.
        </p>
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
        <legend className="font-display text-xl uppercase text-bone">Your jerseys</legend>
        <p className="mt-1 text-sm text-bone-muted">
          {money(price, currency)} each. Add a row per jersey.
        </p>

        <ul className="mt-5 space-y-4">
          {rows.map((row, index) => (
            <li key={row.id} className="rounded-sm border border-ink-600 bg-ink-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-bone-muted">
                  Jersey {index + 1}
                </span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="min-h-11 text-xs font-bold uppercase tracking-[0.14em] text-crimson-400 hover:text-bone"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor={`variant-${row.id}`}>
                    Version
                  </label>
                  <select
                    id={`variant-${row.id}`}
                    className={field}
                    required
                    value={row.variant}
                    onChange={(e) => updateRow(row.id, { variant: e.target.value })}
                  >
                    {variants.map((variant) => (
                      <option key={variant.name} value={variant.name}>
                        {variant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={label} htmlFor={`size-${row.id}`}>
                    Size
                  </label>
                  <select
                    id={`size-${row.id}`}
                    className={field}
                    required
                    value={row.size}
                    onChange={(e) => updateRow(row.id, { size: e.target.value })}
                  >
                    <option value="">Choose a size…</option>
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {nameOnBack && (
                  <div>
                    <label className={label} htmlFor={`name-${row.id}`}>
                      Name on back
                    </label>
                    <input
                      id={`name-${row.id}`}
                      className={field}
                      type="text"
                      maxLength={16}
                      required
                      value={row.nameOnBack}
                      onChange={(e) => updateRow(row.id, { nameOnBack: e.target.value })}
                      placeholder="ENGLES"
                    />
                  </div>
                )}

                {numberOnBack && (
                  <div>
                    <label className={label} htmlFor={`number-${row.id}`}>
                      Number on back
                    </label>
                    <input
                      id={`number-${row.id}`}
                      className={field}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{1,2}"
                      maxLength={2}
                      required
                      value={row.numberOnBack}
                      onChange={(e) => updateRow(row.id, { numberOnBack: e.target.value })}
                      placeholder="22"
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {rows.length < maxJerseys && (
          <button
            type="button"
            onClick={addRow}
            className="mt-4 min-h-11 rounded-sm border border-gold px-4 text-xs font-bold uppercase tracking-[0.14em] text-gold-300 transition-colors hover:bg-gold hover:text-ink"
          >
            + Add another jersey
          </button>
        )}
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl uppercase text-bone">Where it goes</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="fullName">
              Full name
            </label>
            <input id="fullName" name="fullName" className={field} type="text" required autoComplete="name" />
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
          <div className="sm:col-span-2">
            <label className={label} htmlFor="address">
              Shipping address
            </label>
            <textarea
              id="address"
              name="address"
              className={cn(field, 'min-h-24')}
              required
              rows={3}
              autoComplete="street-address"
              placeholder={'Street\nCity, State ZIP'}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl uppercase text-bone">Paying</legend>
        <p className="mt-1 text-sm text-bone-muted">
          Payment is arranged directly with the captain — nothing is charged here.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {paymentMethods.length > 0 && (
            <div>
              <label className={label} htmlFor="paymentMethod">
                Preferred method
              </label>
              <select id="paymentMethod" name="paymentMethod" className={field} required>
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
            I understand my order isn&rsquo;t confirmed until payment is received, and that this
            is a batch pre-order printed after the deadline.
          </span>
        </label>
      </fieldset>

      {turnstileSiteKey && (
        <>
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="dark" />
          <script async defer src="https://challenges.cloudflare.com/turnstile/v0/api.js" />
        </>
      )}

      <div className="flex flex-col gap-4 border-t border-ink-600 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-bone-muted">
          {rows.length} {rows.length === 1 ? 'jersey' : 'jerseys'} ·{' '}
          <strong className="font-display text-2xl text-gold-300">
            {money(total, currency)}
          </strong>
        </p>
        <button
          type="submit"
          disabled={state === 'sending'}
          className="min-h-11 rounded-sm bg-crimson px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:bg-crimson-600 disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending…' : 'Place pre-order'}
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
