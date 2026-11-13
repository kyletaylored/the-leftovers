/**
 * Datadog RUM, gated on analytics consent.
 *
 * Bundled by Astro from BaseLayout (so it's served from our own origin, and
 * `script-src 'self'` holds), but it is tiny: the Datadog SDK itself is a
 * dynamic import, a separate chunk the browser only downloads once the
 * visitor has clicked **Accept analytics**. Visitors who decline, or never
 * choose, download nothing from Datadog and get no `_dd_s_v2` cookie.
 *
 * - Consent comes from the same `localStorage` key CookieConsent writes
 *   (`leftovers_cookie_consent`), read on every page load, and from the
 *   `leftovers:consent` event CookieConsent dispatches when the choice
 *   changes, so accepting starts RUM without a reload and declining stops it
 *   (`setTrackingConsent('not-granted')` ends the session; the SDK only marks
 *   its cookie expired, so this script then deletes it).
 * - Config is the `datadogRum` block of src/data/site.yml, rendered by
 *   BaseLayout as JSON in `#datadog-rum-config`. BaseLayout only includes
 *   this script when an application ID and client token are set, so the
 *   feature is off until someone fills those in. Both values are public by
 *   design (they ship to every browser in Datadog's own snippet).
 * - Every page is a full page load on this site (it's static Astro, not a
 *   single-page app), so RUM's automatic view tracking is exactly one view
 *   per page. No router integration is needed.
 * - The player app at app.theleftoverspb.com reports to the same RUM
 *   application (service `leftovers-app`). Both set
 *   `trackSessionAcrossSubdomains`, so the session cookie lives on
 *   theleftoverspb.com and a visitor who allowed monitoring on both keeps one
 *   session from the site into the app. Each side still asks for its own
 *   consent, and only deletes the cookie when someone declines there, so
 *   undecided visitors here don't end a session the app started.
 */
import { CONSENT_EVENT, DEFAULT_CONSENT_STORAGE_KEY } from '@/lib/consent';

interface RumConfig {
  applicationId: string;
  clientToken: string;
  remoteConfigurationId?: string;
  site: string;
  service: string;
  env: string;
  version?: string;
  sessionSampleRate: number;
  sessionReplaySampleRate: number;
  defaultPrivacyLevel: 'mask' | 'mask-user-input' | 'allow';
}

type Rum = typeof import('@datadog/browser-rum').datadogRum;

const config = readConfig();
let rum: Promise<Rum> | undefined;

function readConfig(): RumConfig | undefined {
  try {
    const el = document.getElementById('datadog-rum-config');
    return el?.textContent ? (JSON.parse(el.textContent) as RumConfig) : undefined;
  } catch {
    return undefined;
  }
}

function storedConsent(): string | null {
  try {
    return window.localStorage.getItem(DEFAULT_CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function start(cfg: RumConfig) {
  rum ??= import('@datadog/browser-rum').then(({ datadogRum }) => {
    datadogRum.init({
      applicationId: cfg.applicationId,
      clientToken: cfg.clientToken,
      // Datadog-hosted overrides (sampling etc.), fetched from
      // sdk-configuration.browser-intake-<site> and cached by the SDK.
      ...(cfg.remoteConfigurationId ? { remoteConfiguration: { id: cfg.remoteConfigurationId } } : {}),
      site: cfg.site,
      service: cfg.service,
      // Local builds and previews report as their own env, so they never
      // muddy production dashboards.
      env: ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ? 'local' : cfg.env,
      ...(cfg.version ? { version: cfg.version } : {}),
      sessionSampleRate: cfg.sessionSampleRate,
      sessionReplaySampleRate: cfg.sessionReplaySampleRate,
      defaultPrivacyLevel: cfg.defaultPrivacyLevel,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      trackSessionAcrossSubdomains: true,
      trackingConsent: 'granted',
    });
    return datadogRum;
  });
  // A visitor who declined and then accepted again on the same page.
  rum.then((r) => r.setTrackingConsent('granted')).catch(() => {});
}

if (config) {
  if (storedConsent() === 'accepted') start(config);
  // Declined: remove any Datadog cookie left behind by an earlier, withdrawn
  // session. Undecided visitors are left alone, since the cookie is shared
  // with the app and may belong to a session they allowed there.
  else if (storedConsent() === 'declined') clearDatadogCookies();

  window.addEventListener(CONSENT_EVENT, (event) => {
    const choice = (event as CustomEvent<string>).detail;
    if (choice === 'accepted') start(config);
    else if (!rum) clearDatadogCookies();
    else
      rum
        ?.then((r) => {
          r.setTrackingConsent('not-granted');
          // The SDK only marks its session cookie expired (`isExpired=1`),
          // and writes that asynchronously. Delete it once it has settled;
          // the page-load sweep below catches anything written later.
          window.setTimeout(clearDatadogCookies, 1000);
        })
        .catch(() => {});
  });
}

/**
 * Datadog's session cookie: `_dd_s` before SDK v7, `_dd_s_v2` since. Shared
 * across subdomains, it sits on the parent domain, so delete it on this host
 * and on every parent.
 */
function clearDatadogCookies() {
  const parts = location.hostname.split('.');
  const domains = parts.slice(0, -1).map((_, i) => parts.slice(i).join('.'));
  for (const raw of document.cookie.split(';')) {
    const name = raw.split('=')[0]?.trim();
    if (!name?.startsWith('_dd_s')) continue;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
  }
}
