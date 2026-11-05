/**
 * Generates docs/COMPONENTS.md from src/lib/components.ts, the compact
 * component brief AI agents read before building a page.
 *
 *   npm run docs:components          write docs/COMPONENTS.md
 *   node scripts/components-doc.ts --check
 *                                    fail if a component file has no catalog
 *                                    entry, an entry points at a missing file,
 *                                    or COMPONENTS.md is stale (run by
 *                                    `npm run build`, so CI catches drift)
 *
 * Plain Node (it strips the TypeScript types itself); no dependencies.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { catalog, groups, recipes, rules, utilities, type Group } from '../src/lib/components.ts';

const OUT = 'docs/COMPONENTS.md';
const COMPONENTS = 'src/components';

function render(): string {
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);

  push(
    '# Components: the page-building brief',
    '',
    '<!-- GENERATED from src/lib/components.ts by `npm run docs:components`. Edit that file, not this one. -->',
    '',
    'Read this before building or changing a page. It replaces reading `src/pages/design.astro` (1,000+ lines) or every component file.',
    '',
    '**Workflow (token-lean):**',
    '1. Pick a recipe below and the components it names.',
    '2. Copy real usage from one specimen only: `grep -n \'title="<Specimen title or component>\' src/pages/design.astro`, then read ~40 lines from there. Or copy from the recipe\'s example page.',
    '3. Need an exact prop type? Read only the `interface Props` block of that file, not the whole file.',
    '4. Nothing fits? Extend the closest component with a prop (keep existing output unchanged), then add its specimen on /design and its entry in src/lib/components.ts.',
    '',
    '## Rules',
    '',
    ...rules.map((r) => `- ${r}`),
    '',
    '## Page recipes',
    '',
    ...recipes.flatMap((r) => [`- **${r.name}** (\`${r.example}\`): ${r.steps}`]),
    '',
    '## Classes and tokens',
    '',
    '| Class | Use |',
    '|---|---|',
    ...utilities.map((u) => `| \`${u.cls}\` | ${u.use} |`),
    '',
    '## Catalog',
    '',
    'Options: `a|b` lists values, default first. Paths are relative to `src/components/`. Specimens: `/design#<section>`.',
    ''
  );

  for (const group of Object.keys(groups) as Group[]) {
    const entries = catalog.filter((c) => c.group === group && !c.internal);
    if (!entries.length) continue;
    push(`### ${groups[group]}`, '');
    if (group === 'site') {
      push(entries.map((e) => `\`${e.name}\``).join(', ') + '.', '');
      continue;
    }
    for (const e of entries) {
      const kind = e.kind === 'Astro' ? '' : `, ${e.kind}`;
      push(`- **${e.name}** (\`${e.file}\`${kind}): ${e.use}`);
      if (e.options) push(`  - Options: ${e.options}`);
      if (e.data) push(`  - Data: ${e.data}`);
      if (e.avoid) push(`  - Avoid: ${e.avoid}`);
      if (e.pairs?.length) push(`  - Pairs with: ${e.pairs.join(', ')}`);
    }
    push('');
  }

  const internal = catalog.filter((c) => c.internal);
  push(
    '### Internal (never import directly on a page)',
    '',
    internal.map((e) => `\`${e.file}\`: ${e.use}`).join(' · '),
    ''
  );
  return lines.join('\n');
}

/** Every .astro/.tsx component except stories and /design doc chrome. */
function componentFiles(dir = COMPONENTS): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'design' ? [] : componentFiles(path);
    if (!/\.(astro|tsx)$/.test(name) || name.endsWith('.stories.tsx')) return [];
    return [relative(COMPONENTS, path).replace(/\\/g, '/')];
  });
}

const doc = render();
const normalise = (s: string) => s.replace(/\r\n/g, '\n');

if (process.argv.includes('--check')) {
  const problems: string[] = [];
  const listed = new Set(catalog.map((c) => c.file));
  for (const f of componentFiles()) {
    if (!listed.has(f)) problems.push(`${COMPONENTS}/${f} has no entry in src/lib/components.ts`);
  }
  for (const c of catalog) {
    const path = c.kind === 'CSS utility' ? c.file : join(COMPONENTS, c.file);
    if (!existsSync(path)) problems.push(`catalog entry "${c.name}" points at missing ${path}`);
  }
  const names = catalog.map((c) => c.name);
  for (const n of names.filter((n, i) => names.indexOf(n) !== i)) problems.push(`duplicate catalog name "${n}"`);
  if (!existsSync(OUT) || normalise(readFileSync(OUT, 'utf8')) !== normalise(doc)) {
    problems.push(`${OUT} is out of date: run npm run docs:components`);
  }
  if (problems.length) {
    console.error(`Component catalog check failed:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Component catalog OK (${catalog.length} entries).`);
} else {
  writeFileSync(OUT, doc);
  console.log(`Wrote ${OUT} (${catalog.length} entries, ${doc.length} chars).`);
}
