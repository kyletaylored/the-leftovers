# Attributions

Third-party assets used on this site, and the terms they're used under.
**Do not remove the corresponding credit from the site footer** — for the
Vecteezy art, attribution is a licence condition, not a courtesy.

## Ruyi cloud motifs

- **Source:** [Ancient Pattern Vectors by Vecteezy](https://www.vecteezy.com/free-vector/ancient-pattern)
- **Files:** `src/assets/clouds/ruyi-cloud-{1..6}.svg`
- **Used for:** the cloud banks in the hero, page headers and CTA strips
- **Modifications:** the hardcoded red fill (`rgb(209,32,38)`) is replaced with
  `currentColor` so the motif can be recoloured from brand tokens, and the
  `width`/`height="100%"` attributes are stripped so CSS controls sizing. See
  `src/lib/clouds.ts`.
- **Terms:** Vecteezy Free License, which **requires attribution**. The credit
  is rendered in the site footer on every page and links to the source.

## Fonts

| Font | Use | Source / licence |
|---|---|---|
| **CC Monster Mash** (**Worn**) | The "THE LEFTOVERS" wordmark, matching the distressed lettering in the official logo art | Comic Book Fonts LLC — **commercial web licence purchased.** Source download kept in the (gitignored) `_reference/` folder |
| **Anton** | Headlines | Google Fonts, SIL Open Font License 1.1 |
| **Inter** | Body and UI text | Google Fonts, SIL Open Font License 1.1 |

### CC Monster Mash — licence terms that affect the code

Read these before "optimising" the font. The licence is specific.

- **WOFF2 only for web.** Only `Web/CCMonsterMash-Regular.woff2` is shipped
  (`src/assets/fonts/`). The OTF/TTF files in the vendor download are licensed
  for **desktop use**, not embedding, so they are deliberately not in the repo.
- **Only the one cut we use.** `Worn` is the one that ships, chosen to match
  the roughed-up edges of the logo lettering. The download also includes
  Regular, Outline, Color and Legacy files; none are used, so none are
  committed. `Worn` costs ~89KB against ~48KB for `Regular` — a knowing
  trade for brand fidelity, and affordable only because the face is not
  preloaded, so it never blocks first paint.
- **Do NOT subset, re-encode or convert it.** The licence forbids derivative
  works and reverse-engineering, and subsetting or transcoding the file is
  arguably both. This is why the font ships at its full ~48KB rather than
  subsetted to the handful of glyphs in "THE LEFTOVERS" — the saving isn't
  ours to take. It is also why the font is **not preloaded** (see
  `BaseLayout.astro`): if we can't make it smaller, we can at least keep it
  off the critical path.
- **Single domain.** Licensed for `theleftoverspb.com`. A second domain —
  including a staging domain that serves it publicly — needs additional
  licensing.
- **Monthly pageview allowance.** The standard web licence covers **10,000
  pageviews per month**. Not a concern at current traffic, and noted here only
  so it isn't a surprise later — if the site ever takes off, buy the extra
  tier rather than discovering this in a licence audit.
- **No AI/ML training** on the font files.

## Brand art

The logo (`leftovers-logo.png`) and icon (`leftovers-icon.png`) were supplied
by the team. Optimized derivatives live in `src/assets/img/brand/` and are
regenerated with `npm run brand`.
