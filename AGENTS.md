<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tools** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them. `codegraph_node` returns one symbol's source + callers, or reads a whole file with line numbers. If the tools are listed but deferred, load them by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` and `codegraph node <symbol-or-file>` print the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

## Design system

The site's design system is documented in two places. Together they are the
source of truth for what already exists:

| Where | What it covers | How to view |
| --- | --- | --- |
| **`/design`** (`src/pages/design.astro`) | Tokens, motifs, icons, and a live specimen of **every** component (Astro and React), plus the **component index** table | `npm run dev` → <http://localhost:4321/design> |
| **Storybook** (`src/components/*.stories.tsx`, `src/stories/foundations/`) | **Foundations** (colours, typography, icons, textures) and **React islands**: interactive states and `play` tests | `npm run storybook` · tests: `npx vitest run` |

Storybook can't render `.astro` files, so Astro components are documented
only on `/design`. React islands appear in both places. Foundations appear in
both too, because both render from the same data files in `src/lib/`
(`palette.ts`, `icons.ts`, `textures.ts`). Edit the data file, not either page.

New colour token? Add it to `@theme` in `global.css` **and** a row to
`src/lib/palette.ts`. New background texture? Add the utility in
`global.css`, its tile in `public/img/` (sand and seigaiha come from
`scripts/make-pattern-tiles.mjs`), and a row to `src/lib/textures.ts`.

### Building a new page

1. **Look at `/design` first.** Read the component index at the bottom of
   `src/pages/design.astro` and build from what's there: `Section`,
   `PageHeader`, `Button`, `Pill`, `EventCard`, `PlayerCard`, `FeatureRow`,
   `FormField`, `MascotCallout` (empty states), `ImagePlaceholder` (missing
   photos), and so on. Copy usage from the specimen markup. It's real,
   working code.
2. **Don't hand-roll something that exists.** If a component almost fits,
   extend it with a prop and keep existing call sites' output unchanged.
   Don't fork it or restyle it inline.
3. **Use tokens, never raw hex.** Colours, fonts and the `.numeral`,
   `.eyebrow`, `.field-*`, `.bg-*` texture (see `src/lib/textures.ts`) and `.tap` utilities live in
   `src/styles/global.css`. Respect the fill/text split: `crimson` and `gold`
   are fills, while `crimson-400` and `gold-300` are their AA-passing text
   colours. (The `/design` page's cream "paper" chrome is the one deliberate
   exception. It's documentation, not brand.)
4. **Copy comes from content collections** (`src/content/**`,
   `src/data/site.yml`), not hardcoded strings in the page.
5. Mind accessibility: one `h1` per page, cards take an `as` heading prop,
   touch targets are at least 44px (`.tap`), and focus rings stay visible.

### Building or changing a component

Astro by default. Use a React island (`.tsx`, hydrated with `client:*`) only
when the component needs client-side state, and give it a thin `.astro`
server half if it needs collection or image data (see `GallerySlideshow.astro`
→ `Slideshow.tsx`, `EventsCalendar.astro` → `Calendar.tsx`).

Every new or changed component must be documented in the same change:

1. **Add or update its specimen on `/design`.** Put it in the matching
   `<DocSection>` (Components, Blocks, Marketing, Forms, Calendar, Imagery…),
   wrapped in `<Specimen title file note>`. Show every variant and state, and
   write `note` as "when to use it". Render it with real collection data where
   it takes any.
2. **Add or update its row in the `index` array** in `src/pages/design.astro`
   (name, file, kind, section anchor, `story`, use-it-for).
3. **If it's a React island, add or update `ComponentName.stories.tsx`** next
   to it: one story per meaningful variant, plus a `play` test asserting the
   key interaction or ARIA state. Set `story: true` on its index row.
4. **New icon?** Add the path to `src/lib/icons.ts`. `Icon.astro` and the
   `/design` icon grid both read from it, so nothing else needs editing.
5. Put a doc comment at the top of the component: what it is, why it exists,
   and any accessibility or no-JS behaviour.

### Verify before you finish

- `npm run build`: `astro check` (types) and the full static build.
- `npx vitest run`: every Storybook story's `play` test, in headless Chromium.
- Open `/design` and check your specimen at desktop and phone width.
