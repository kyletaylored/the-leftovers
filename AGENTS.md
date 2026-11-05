<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tools** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them. `codegraph_node` returns one symbol's source + callers, or reads a whole file with line numbers. If the tools are listed but deferred, load them by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` and `codegraph node <symbol-or-file>` print the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

# The Leftovers website: agent instructions

The site for a community-run paintball team. It's a static Astro 7 site with
Tailwind v4, a few React 19 islands, content collections edited through Pages
CMS, and deploys to GitHub Pages on every push to `main`. Live at
https://theleftoverspb.com. The repo is **public**.

## Read first

1. **[`docs/HANDOFF.md`](docs/HANDOFF.md)**: current state, what's
   placeholder, open work in priority order, and a map of the reference
   material.
2. **[`docs/PRD.md`](docs/PRD.md)**: the v1 spec. "§n" references in the
   comments and docs point here.
3. **[`docs/PRD-CONFORMANCE.md`](docs/PRD-CONFORMANCE.md)**: every deliberate
   deviation from the PRD and its reason. If the code and the PRD disagree,
   check this file before "fixing" anything. React instead of Svelte, GitHub
   Pages instead of Cloudflare, the `/team` merge and no Discord are all
   intentional.
4. The doc comment at the top of any file you're about to change. They record
   the *why* (hydration pinning, UTC dates, licence limits) and are
   load-bearing.

## Hard constraints

Don't break these without the owner explicitly deciding to:

- **No backend, database, accounts or self-hosted checkout.** Dynamic needs go
  to a free third party: forms go to Google Forms, the mailing list goes to its
  provider, and the store is an external link.
- **Analytics is opt-in (EU / GDPR compliant).** Google Tag Manager (`site.gtmId`)
  runs behind `CookieConsent` using Google Consent Mode v2 (`analytics_storage`
  defaults to `'denied'` and `gtm.js` only loads after the visitor clicks
  **Accept analytics**). Any new cookie-setting script must likewise be gated
  by consent and disclosed in `/privacy`.
- **Strict CSP** (`public/_headers`): `img-src 'self' data:` and
  `font-src 'self'`. Images and fonts must be local, and any third-party
  embed needs its origin allowlisted there.
- **Images live in `src/assets/img/`** and go through `<Image>`/`getImage`.
  `public/` is for files that must keep a fixed URL (texture tiles, OG card,
  CNAME).
- **Every image field in a collection has a required `alt`** in both
  `src/content.config.ts` and `.pages.yml`. Keep the two in sync whenever you
  add or change a field.
- **Never store derived values in content.** Rates, records, totals and
  upcoming/past are computed in `src/lib/`. Content holds only what a human
  observed.
- **Dates are formatted in UTC** (`src/lib/format.ts`). Don't switch them to
  local time.
- **The licensed brush font** (`src/assets/fonts/CCMonsterMash-Worn.woff2`):
  never subset or convert it, and never commit the OTF/TTF desktop files from
  `_reference/`. The licence is per-domain (`ATTRIBUTIONS.md`).
- **Mobile Lighthouse ≥ 90 on every category; in practice ~97–100.** Islands
  are `client:visible` and never above the fold.
- **WCAG AA.** One `h1` per page (owned by `PageHeader`/`Hero`), touch targets
  of at least 44px, and visible focus rings.

## Content vs code

Content (players, events, results, preorders, pages, `src/data/site.yml`) is
the team's, edited through Pages CMS. Those edits arrive as commits on `main`,
so **pull before you push**. Much of the content is currently placeholder
(see HANDOFF §2). Don't invent real-looking content: no fake sponsors,
results or photos. Use `MascotCallout` empty states or `ImagePlaceholder`
instead.

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
The utility sets `--tex` (the tile) and `--tex-w` (its width) rather than
`background-image` directly, so `.bg-drift` can animate it.

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

## Keep the handoff docs true

Docs that drift are worse than no docs. In the same change:

- **Finished an item from HANDOFF §7, or created a new one?** Update
  `docs/HANDOFF.md`, including the "as of" date at the top.
- **Deliberately deviated from the PRD?** Add a dated note to
  `docs/PRD-CONFORMANCE.md` saying what changed and why. Never edit
  `docs/PRD.md`: it's the frozen v1 contract.
- **Changed how the team edits something?** Update `docs/EDITING.md` (written
  for non-developers) and the matching `.pages.yml` field.
- **New reference image?** Commit a downsized WebP to `docs/design/`
  (`cwebp -q 72 -resize 1600 0 in.png -o docs/design/name.webp`) and add a row
  to HANDOFF §6. The full-resolution original stays in gitignored
  `_reference/`.

## Git

- **Isolate concurrent agent work in separate git worktrees / workspaces.**
  Never edit the primary working tree at the same time as another agent or task:
  - Before starting changes, check `git status` and `git worktree list`. If the
    working tree already has uncommitted work from another task, or when running
    parallel tasks, work in an isolated worktree (`git worktree add .worktrees/<task-slug> -b <task-slug>`
    or subagent `Workspace: 'share'` / `'branch'`) so agents don't overwrite
    each other's index or files.
  - Open a Pull Request (`gh pr create`) from your worktree branch so changes
    can be reviewed independently before landing on `main`, and remove temporary
    worktrees once merged (`git worktree remove .worktrees/<task-slug>`).
- **Include screenshots on PRs for visual changes.** Whenever a change affects
  UI, layout, typography, motifs, or components (including `/design` specimens),
  capture screenshots (desktop and mobile where relevant) and attach or embed
  them in the PR description or a PR comment so the owner can review the visual
  result directly in GitHub.
- **Pull before pushing.** Pages CMS commits arrive on `main`, so always
  `git pull --rebase origin main` before pushing or merging. A push/merge to
  `main` deploys to production.
- **Commits are SSH-signed.** If signing fails, the SSH agent is locked: ask
  the owner to unlock it, and never disable signing.
