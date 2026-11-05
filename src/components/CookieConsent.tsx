/**
 * CookieConsent — EU/GDPR cookie & analytics consent banner + preferences manager.
 *
 * Why it exists: the team plays events in Europe (NXL Europe) as well as the US,
 * so analytics (Google Tag Manager / Google Analytics) must not set non-essential
 * cookies until the visitor opts in.
 *
 * Behaviour:
 * - Defaults Google Consent Mode v2 (`analytics_storage`, `ad_storage`,
 *   `ad_user_data`, `ad_personalization`) to `'denied'`.
 * - Stores the visitor's choice (`'accepted'` | `'declined'`) in `localStorage`.
 * - Only injects `https://www.googletagmanager.com/gtm.js?id=<gtmId>` when the
 *   visitor grants consent (either on click or on subsequent page loads).
 * - Both action buttons ("Accept analytics" and "Essential only") share the same
 *   44px `.tap` sizing and visual weight to satisfy EU equal-prominence rules.
 * - Any element with `[data-cookie-consent-open]` (such as the "Cookie settings"
 *   button in the footer) or a `leftovers:open-cookie-consent` window event
 *   re-opens the banner so visitors can withdraw or change consent at any time.
 * - Dispatches a `leftovers:consent` window event (`detail`: the choice)
 *   whenever the visitor chooses, so other consent-gated analytics, such as
 *   Datadog RUM (src/scripts/datadog-rum.ts), start or stop without a reload.
 *   Specimens with `disableScriptLoad` don't dispatch it.
 * - With JS disabled, GTM never loads and no analytics cookies are set.
 */
import { useEffect, useState } from 'react';
import { CONSENT_EVENT, DEFAULT_CONSENT_STORAGE_KEY } from '@/lib/consent';

export type ConsentChoice = 'undecided' | 'accepted' | 'declined';

export interface CookieConsentProps {
  /** Google Tag Manager container ID, e.g. "GTM-KPXD7QD6". */
  gtmId?: string;
  /** `fixed` pins bottom-centre on the live site; `inline` sits in flow on `/design` and Storybook. */
  position?: 'fixed' | 'inline';
  /** localStorage key. Override in specimens/tests so previewing doesn't overwrite real consent. */
  storageKey?: string;
  /** Optional initial state for `/design` and Storybook specimens. */
  initialChoice?: ConsentChoice;
  /**
   * When true (used in inline specimens), collapsing after a choice leaves a
   * compact status bar with a "Change preferences" button so builders can test
   * both states in place.
   */
  showManageWhenDecided?: boolean;
  /** Prevent injecting the live GTM script tag inside isolated Storybook/design specimens. */
  disableScriptLoad?: boolean;
  privacyHref?: string;
  termsHref?: string;
  className?: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export { DEFAULT_CONSENT_STORAGE_KEY };

function clearAnalyticsCookies() {
  if (typeof document === 'undefined') return;
  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (const raw of cookies) {
    const name = raw.split('=')[0]?.trim();
    // _ga*: Google Analytics. _dd_s*: Datadog RUM's session cookie (_dd_s_v2
    // since SDK v7). datadog-rum.ts deletes it again after the SDK stops.
    if (name && (name === '_ga' || name === '_gid' || name === '_gat' || name.startsWith('_ga_') || name.startsWith('_dd_s'))) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  }
}

export function applyGtmConsent(
  choice: 'accepted' | 'declined',
  gtmId?: string,
  disableScriptLoad = false
) {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }

  if (choice === 'accepted') {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());

    if (gtmId && !disableScriptLoad && typeof document !== 'undefined') {
      const existing = document.querySelector(`script[data-gtm-id="${gtmId}"]`);
      if (!existing) {
        window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
        script.dataset.gtmId = gtmId;
        document.head.appendChild(script);
      }
    }
  } else {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    clearAnalyticsCookies();
  }
}

export default function CookieConsent({
  gtmId = 'GTM-KPXD7QD6',
  position = 'fixed',
  storageKey = DEFAULT_CONSENT_STORAGE_KEY,
  initialChoice,
  showManageWhenDecided = false,
  disableScriptLoad = false,
  privacyHref = '/privacy',
  termsHref = '/terms',
  className = '',
}: CookieConsentProps) {
  const [choice, setChoice] = useState<ConsentChoice>(initialChoice ?? 'undecided');
  const [isOpen, setIsOpen] = useState<boolean>(initialChoice ? initialChoice === 'undecided' : false);
  const [hydrated, setHydrated] = useState<boolean>(Boolean(initialChoice));

  useEffect(() => {
    if (initialChoice !== undefined) {
      setChoice(initialChoice);
      setIsOpen(initialChoice === 'undecided');
      setHydrated(true);
      return;
    }

    let stored: ConsentChoice = 'undecided';
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === 'accepted' || raw === 'declined') {
        stored = raw;
      }
    } catch {
      // Private browsing / blocked storage: treat as undecided for this view.
    }

    setChoice(stored);
    setIsOpen(stored === 'undecided');
    setHydrated(true);

    if (stored === 'accepted' || stored === 'declined') {
      applyGtmConsent(stored, gtmId, disableScriptLoad);
    }
  }, [gtmId, initialChoice, storageKey, disableScriptLoad]);

  useEffect(() => {
    if (position !== 'fixed') return;

    function handleOpen() {
      setIsOpen(true);
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest('[data-cookie-consent-open]') : null;
      if (target) {
        event.preventDefault();
        setIsOpen(true);
      }
    }

    window.addEventListener('leftovers:open-cookie-consent', handleOpen);
    document.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('leftovers:open-cookie-consent', handleOpen);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [position]);

  function handleSelect(next: 'accepted' | 'declined') {
    setChoice(next);
    setIsOpen(false);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Ignore storage write errors in restricted browsing modes.
    }
    applyGtmConsent(next, gtmId, disableScriptLoad);
    if (!disableScriptLoad) {
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
    }
  }

  if (!hydrated) {
    return (
      <div
        aria-hidden="true"
        className={
          position === 'fixed'
            ? 'pointer-events-none fixed bottom-0 left-0 h-px w-px opacity-0'
            : 'h-px w-px'
        }
      />
    );
  }

  if (!isOpen) {
    if (!showManageWhenDecided) {
      return (
        <div
          aria-hidden="true"
          className={
            position === 'fixed'
              ? 'pointer-events-none fixed bottom-0 left-0 h-px w-px opacity-0'
              : 'hidden'
          }
        />
      );
    }
    return (
      <div
        role="region"
        aria-label="Cookie and analytics preferences"
        className={[
          'flex flex-wrap items-center justify-between gap-3 rounded-sm border border-ink-600 bg-ink-800 px-4 py-3 text-xs text-bone-muted',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={[
              'inline-block size-2 rounded-full',
              choice === 'accepted' ? 'bg-gold' : 'bg-bone-muted',
            ].join(' ')}
          />
          <span>
            Cookie preference saved:{' '}
            <strong className="text-bone">
              {choice === 'accepted' ? 'Analytics enabled' : 'Essential only (no analytics)'}
            </strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="tap inline-flex items-center px-2 font-bold uppercase tracking-[0.12em] text-gold-300 underline decoration-gold/50 underline-offset-4 transition-colors hover:text-gold"
        >
          Change preferences
        </button>
      </div>
    );
  }

  return (
    <section
      role="region"
      aria-label="Cookie and analytics preferences"
      className={[
        'rounded-sm border border-gold bg-ink-800 p-4 sm:p-5',
        position === 'fixed'
          ? 'fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl shadow-2xl shadow-ink/80'
          : 'w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow">Cookies &amp; Analytics</p>
            {choice !== 'undecided' && (
              <span className="text-[0.6875rem] text-bone-muted">
                Current:{' '}
                <strong className="text-bone">
                  {choice === 'accepted' ? 'Analytics on' : 'Essential only'}
                </strong>
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-bone">
            We use cookies to collect analytics for site traffic and performance. See our{' '}
            <a
              href={privacyHref}
              className="text-gold-300 underline decoration-gold/50 underline-offset-2 hover:text-gold"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href={termsHref}
              className="text-gold-300 underline decoration-gold/50 underline-offset-2 hover:text-gold"
            >
              Terms &amp; Conditions
            </a>
            .
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:flex-nowrap">
          <button
            type="button"
            onClick={() => handleSelect('declined')}
            aria-pressed={choice === 'declined'}
            className="tap flex-1 cursor-pointer rounded-sm border border-gold/80 bg-ink-900 px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:border-gold hover:bg-ink-700 hover:text-gold-300 sm:flex-initial"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => handleSelect('accepted')}
            aria-pressed={choice === 'accepted'}
            className="tap flex-1 cursor-pointer rounded-sm border border-crimson bg-crimson px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:border-crimson-600 hover:bg-crimson-600 sm:flex-initial"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </section>
  );
}
