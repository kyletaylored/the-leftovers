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
| **Monster Mash** (`MonsterMashMedium.ttf`) | The "THE LEFTOVERS" wordmark, matching the official logo art | Supplied by the team. Self-hosted from `src/assets/fonts`. **Confirm the licence covers web embedding before launch** — see the note below |
| **Anton** | Headlines | Google Fonts, SIL Open Font License 1.1 |
| **Inter** | Body and UI text | Google Fonts, SIL Open Font License 1.1 |

> **Open question on Monster Mash:** it was supplied as a `.ttf` without a
> licence file. Many display faces distributed free for personal use require a
> paid licence for web embedding (`@font-face`), which is what this site does.
> Worth confirming the source and terms before launch. If it turns out to be
> personal-use only, the fix is small: the wordmark already renders through one
> component (`Wordmark.astro`), and the official logo art covers the places it
> matters most.

## Brand art

The logo (`leftovers-logo.png`) and icon (`leftovers-icon.png`) were supplied
by the team. Optimized derivatives live in `src/assets/img/brand/` and are
regenerated with `npm run brand`.
