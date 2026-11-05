---
name: build-page
description: Build or restructure a page on The Leftovers site (src/pages/*.astro) from the existing design-system components. Use when asked to "build a page", "add a section", "make a landing page", or to lay out new content, so the right components, variants and classes get chosen without reading the whole codebase.
---

# Build a page from the design system

Goal: a page assembled from existing components, reading as little as possible.

1. **Read `docs/COMPONENTS.md`** (about 4k tokens). It has the rules, page recipes, classes and every component's options. Don't open `src/pages/design.astro` or component files wholesale.
2. **Pick the closest recipe** and list the components it needs, with variants. If the request is ambiguous about page type or content source, ask once, briefly.
3. **Copy real usage, narrowly:**
   - From the recipe's example page, or
   - From one specimen: `grep -n 'title="<Name>' src/pages/design.astro`, then read about 40 lines from that line.
   - For an exact prop type, read only that file's `interface Props` block.
4. **Wire the data from collections** (`getCollection`, `getEvents()` in `src/lib/events.ts`, `src/data/site.yml`). Never hardcode copy or invent content. Missing content gets `MascotCallout` or `ImagePlaceholder`.
5. **Check the rules** in COMPONENTS.md:
   - One h1, from PageHeader or Hero.
   - `as` heading levels.
   - Alternate Section tones.
   - Full-bleed blocks go between Sections.
   - At most one moving element per view.
   - Islands are `client:visible`.
6. **Need a new variant or component?**
   - Extend the closest component with a prop, without changing existing output.
   - Add its specimen on `/design`.
   - Add its entry in `src/lib/components.ts`, then run `npm run docs:components`.
   - `npm run build` fails if the catalog or doc drifts.
7. **Verify:**
   - Run `npm run build`.
   - Open the page at desktop and phone width.
   - Follow AGENTS.md for the PR, including screenshots.
