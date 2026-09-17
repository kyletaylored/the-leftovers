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
 * Two modes, and the DEFAULT one commits the team to nothing:
 *
 *  - `handoff` (no endpoint configured) — the form validates, prices and
 *    formats the order, then hands the finished text back to the buyer to
 *    send themselves by email or paste wherever the team already talks. No
 *    account, no signup, no monthly cap, no vendor. The form still does the
 *    valuable part: turning a comment thread into a complete, unambiguous
 *    order with a total on it.
 *  - `post` (endpoint configured) — submits directly. Works with a form
 *    relay, a Cloudflare Function, or a **Google Form's `formResponse`
 *    endpoint** via `provider: 'google-form'`, which maps our field names
 *    onto Google's `entry.NNN` ids so responses land in a Google Sheet while
 *    the visible form stays entirely ours.
 *
 * See docs/PREORDERS.md.
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
  /** Optional submit endpoint. Empty = `handoff` mode (the default). */
  endpoint?: string;
  /** `google-form` switches to Google's entry.NNN encoding. */
  provider?: string;
  /**
   * Google Forms only: our field name -> `entry.NNN` id. See
   * docs/PREORDERS.md for how to read the ids off a prefill link.
   */
  fieldMap?: Record<string, string>;
  /** Where a handoff-mode order is emailed. */
  teamEmail: string;
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
  provider,
  fieldMap = {},
  teamEmail,
  turnstileSiteKey,
  maxJerseys = 6,
}: PreorderFormProps) {
  const mountedAt = useRef(Date.now());
  const [rows, setRows] = useState<JerseyRow[]>([
    { id: 1, variant: variants[0]?.name ?? '', size: '', nameOnBack: '', numberOnBack: '' },
  ]);
  const [state, setState] = useState<'idle' | 'sending' | 'review' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

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

  /** One readable order, for a human reading an email — not a database row. */
  function buildSummary(data: FormData) {
    const lines = rows.map((row, index) => {
      const parts = [`  ${index + 1}. ${row.variant}`, `size ${row.size}`];
      if (nameOnBack && row.nameOnBack) parts.push(`name "${row.nameOnBack}"`);
      if (numberOnBack && row.numberOnBack) parts.push(`number ${row.numberOnBack}`);
      return parts.join(' · ');
    });

    const get = (key: string) => String(data.get(key) ?? '').trim();

    return [
      `${campaign} — pre-order`,
      '',
      `Jerseys (${rows.length}):`,
      ...lines,
      '',
      `Total: ${money(total, currency)}`,
      '',
      `Name:  ${get('fullName')}`,
      `Email: ${get('email')}`,
      ...(get('phone') ? [`Phone: ${get('phone')}`] : []),
      '',
      'Ship to:',
      ...get('address')
        .split('\n')
        .map((line) => `  ${line}`),
      '',
      ...(get('paymentMethod') ? [`Paying by: ${get('paymentMethod')}`] : []),
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

    // Default path: hand the finished order back to the buyer. Nothing leaves
    // the browser, so there is no service to sign up for and no cap to hit.
    if (!endpoint) {
      setState('review');
      return;
    }

    data.delete('company');
    data.set('campaign', campaign);
    data.set('jerseyCount', String(rows.length));
    data.set('orderTotal', money(total, currency));
    data.set('summary', text);

    setState('sending');

    /**
     * Google Forms path.
     *
     * Google serves no CORS headers on `formResponse`, so this is necessarily
     * `mode: 'no-cors'` — the request goes out, the response is opaque, and we
     * CANNOT tell whether it succeeded. That's why the confirmation screen
     * still shows the order text and a copy button: if this silently failed,
     * the buyer hasn't lost anything and can send it across themselves.
     */
    if (provider === 'google-form') {
      const params = new URLSearchParams();
      for (const [name, entryId] of Object.entries(fieldMap)) {
        const value = String(data.get(name) ?? '').trim();
        if (value) params.set(entryId, value);
      }
      try {
        await fetch(endpoint, { method: 'POST', mode: 'no-cors', body: params });
      } catch {
        // Opaque either way; fall through to the receipt.
      }
      setState('done');
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
      // Falling back to the handoff view beats a dead end: the order is
      // already formatted, so the buyer can still send it themselves.
      setState('review');
      setError(
        'Couldn\u2019t send that automatically — here\u2019s your order to send across instead.'
      );
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be blocked; the textarea is selectable as a fallback.
      setCopied(false);
    }
  }

  const mailtoHref = `mailto:${teamEmail}?subject=${encodeURIComponent(
    `Pre-order: ${campaign}`
  )}&body=${encodeURIComponent(summary)}`;

  /** Shared: what to pay, how, and the sentence that matters most. */
  const nextSteps = (
    <>
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
      <p className="mt-5 text-sm leading-relaxed text-bone-muted">
        <strong className="text-bone">Your spot isn&rsquo;t held until payment arrives.</strong>{' '}
        We&rsquo;ll confirm once it does. If you don&rsquo;t hear back within a day or two, chase
        us — it means something went wrong, not that you&rsquo;re in.
      </p>
    </>
  );

  // Handoff mode: the order is priced and formatted; the buyer sends it.
  if (state === 'review') {
    return (
      <div className="rounded-sm border border-gold/60 bg-ink-800 p-6 sm:p-8" role="status" aria-live="polite">
        <h3 className="font-display text-2xl uppercase text-bone">Your order is ready to send</h3>
        <p className="mt-3 text-sm leading-relaxed text-bone-muted">
          {rows.length} {rows.length === 1 ? 'jersey' : 'jerseys'} — total{' '}
          <strong className="text-bone">{money(total, currency)}</strong>. Email it across or paste
          it wherever you normally reach us. Nothing has been sent automatically.
        </p>

        {error && (
          <p className="mt-3 text-sm text-crimson-400" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="order-summary" className={cn(label, 'mt-6')}>
          Your order
        </label>
        <textarea
          id="order-summary"
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
            Email this order
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
            Edit order
          </button>
        </div>

        {nextSteps}
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

        {/* Kept as a receipt on purpose. A Google Forms submission is opaque
            (no CORS), so we can't prove it landed — this way a silent failure
            costs the buyer nothing. */}
        <details className="mt-5">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.14em] text-gold-300">
            Your order, for your records
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
