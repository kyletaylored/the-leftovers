/**
 * Shared names for analytics consent, so the CookieConsent island and the
 * plain scripts that act on it (GTM's inline bootstrap in BaseLayout,
 * src/scripts/datadog-rum.ts) can't drift apart.
 */

/** localStorage key holding `'accepted'` | `'declined'`. */
export const DEFAULT_CONSENT_STORAGE_KEY = 'leftovers_cookie_consent';

/**
 * Window event CookieConsent dispatches when the visitor makes or changes a
 * choice; `detail` is `'accepted'` | `'declined'`. Lets analytics scripts
 * start or stop without a page reload.
 */
export const CONSENT_EVENT = 'leftovers:consent';
