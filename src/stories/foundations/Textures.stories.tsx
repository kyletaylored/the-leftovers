import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { textures } from '@/lib/textures';

/**
 * Foundations / Textures: the repeatable .bg-* background utilities from
 * src/lib/textures.ts (the same list /design uses). Tiles are SVGs in
 * public/img/; sand and seigaiha come from scripts/make-pattern-tiles.mjs.
 *
 * "text-safe" textures may sit behind body text; "decorative" ones never do.
 * The play test checks every utility resolves to its tile and that the tile
 * file is actually served.
 */
function Swatches() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {textures.map((t) => (
        <figure key={t.className}>
          <div data-texture={t.className} className={`${t.className} h-44 border border-ink-600`} />
          <figcaption className="mt-2 space-y-0.5">
            <code className="font-mono text-xs text-gold-300">.{t.className}</code>{' '}
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-bone-muted">
              {t.textSafe ? 'text-safe' : 'decorative'}
            </span>
            <p className="text-xs text-bone-muted">{t.use}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** What "text-safe" means in practice: a real content block on each texture. */
function OnText() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {textures
        .filter((t) => t.textSafe)
        .map((t) => (
          <section key={t.className} className={`${t.className} p-8`}>
            <p className="eyebrow">{t.tone ? `<Section tone="${t.tone}">` : `.${t.className}`}</p>
            <h2 className="mt-2 font-display text-3xl uppercase text-bone">Meet the crew</h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-bone-muted">
              Paintball builds better people. Body copy stays readable because the
              texture sits at low opacity under the ink.
            </p>
          </section>
        ))}
    </div>
  );
}

/** Bold textures as accents: a thin band and a framed panel, never under copy. */
function DecorativeAccents() {
  return (
    <div className="space-y-6">
      <div className="bg-seigaiha-bold h-10" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <div className="bg-sand-bold min-h-48" aria-hidden="true" />
        <div className="bg-ink-800 p-8">
          <p className="eyebrow">Decorative pairing</p>
          <h2 className="mt-2 font-display text-3xl uppercase text-bone">Text beside, not on top</h2>
          <p className="mt-3 text-sm text-bone-muted">
            Bold tiles carry the brand gold at full strength. Put copy on a solid
            surface next to them.
          </p>
        </div>
      </div>
      <div className="bg-seigaiha-bold h-10" aria-hidden="true" />
    </div>
  );
}

const meta = {
  title: 'Foundations/Textures',
  decorators: [(Story) => <div className="bg-ink p-6"><Story /></div>],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  render: () => <Swatches />,
  play: async ({ canvasElement }) => {
    for (const t of textures) {
      const el = canvasElement.querySelector<HTMLElement>(`[data-texture="${t.className}"]`)!;
      await expect(getComputedStyle(el).backgroundImage).toContain(t.tile);
      const res = await fetch(t.tile);
      await expect(res.ok).toBe(true);
    }
  },
};

export const TextSafeWithCopy: Story = {
  render: () => <OnText />,
};

export const DecorativeAccents_: Story = {
  name: 'Decorative accents',
  render: () => <DecorativeAccents />,
};
