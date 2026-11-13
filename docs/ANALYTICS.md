# Analytics and monitoring

Two tools, both **off until a visitor clicks Accept analytics** in the cookie
banner (`src/components/CookieConsent.tsx`). Both are disclosed on
`/privacy`, and any new tool must be gated and disclosed the same way.

| Tool | Setting (`src/data/site.yml`) | Loaded by |
|---|---|---|
| Google Tag Manager / GA4 | `gtmId` | Inline script in `BaseLayout.astro` + `applyGtmConsent` |
| Datadog RUM (+ Session Replay) | `datadogRum` | `src/scripts/datadog-rum.ts` |

## How consent reaches each tool

- The banner stores `accepted` | `declined` in `localStorage`
  (`leftovers_cookie_consent`, named in `src/lib/consent.ts`), and fires a
  `leftovers:consent` window event when the choice changes.
- Every page load re-reads that key. Neither SDK remembers consent across
  pages on its own.
- **Datadog:** the SDK is a separate bundled chunk, downloaded with a dynamic
  `import()` only after consent. Before that, nothing from Datadog runs, is
  fetched or is stored. That's stricter than Datadog's `trackingConsent:
  'pending'` pattern, where the SDK is already loaded.
  - **Accept:** `init({ trackingConsent: 'granted', ... })`.
  - **Withdraw:** `setTrackingConsent('not-granted')` stops collection and
    ends the session, and the script then deletes the `_dd_s_v2` cookie. Datadog
    only marks it expired.
- Session persistence is the default cookie (`_dd_s_v2` in SDK v7). It's only set after
  consent, so it needs no cookie-free fallback.
- **Shared with the player app.** The app at `app.theleftoverspb.com` reports
  to the same RUM application as service `leftovers-app`. Both set
  `trackSessionAcrossSubdomains`, so the cookie sits on `theleftoverspb.com`
  and one session follows a visitor from the site into the app, as long as
  they allowed monitoring on both (each asks separately). Each side deletes
  the cookie, on every parent domain, only when someone declines there, so an
  undecided visitor on one side doesn't end a session the other started. If the Datadog Logs SDK is
  ever added, give it the **same** `sessionPersistence` as RUM: the two
  share one session store, and a mismatch silently stops RUM collecting.

## Datadog settings

- **`applicationId`, `clientToken`:** public values, safe in the repo. RUM is
  off until both are set.
- **`remoteConfigurationId`:** lets sampling be tuned in Datadog's UI without a
  deploy. Remote values override `site.yml`.
- **`sessionReplaySampleRate`:** 20% of recorded sessions.
- **`defaultPrivacyLevel: mask-user-input`:** keeps every form field
  (join-request names, emails, phone numbers) out of replays.
- **`version`:** the deployed commit (`GITHUB_SHA`), set at build time.
- **`env`:** `production`, or `local` automatically on localhost.

## Security policy

`public/_headers` allowlists `browser-intake-datadoghq.com` and
`sdk-configuration.browser-intake-datadoghq.com` (US1) in `connect-src`,
plus `worker-src blob:` for Replay's compression worker. If `datadogRum.site`
moves to another region, change those hosts too
([Datadog CSP docs](https://docs.datadoghq.com/integrations/content_security_policy_logs/)).
