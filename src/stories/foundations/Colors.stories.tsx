import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { palette } from '@/lib/palette';

/**
 * Foundations / Colors: the brand palette, rendered from src/lib/palette.ts
 * (the same list /design uses). Each swatch is painted by its real Tailwind
 * token class, and the play test checks the class resolves to the documented
 * hex, so the docs and global.css can't drift apart silently.
 */
function Palette() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {palette.map((c) => (
        <li key={c.name}>
          <div data-token={c.name} className={`h-16 border border-ink-600 ${c.swatch}`} />
          <p className="mt-1.5 font-mono text-[0.6875rem] text-bone">{c.hex}</p>
          <p className="text-[0.6875rem] font-bold text-gold-300">{c.name}</p>
          <p className="text-[0.6875rem] text-bone-muted">{c.role}</p>
        </li>
      ))}
    </ul>
  );
}

function FillTextSplit() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 bg-ink p-5">
        <span className="inline-block bg-crimson px-3 py-1.5 text-sm font-bold text-bone">crimson: fill</span>
        <p className="text-crimson-400">crimson-400: crimson as text on ink (AA)</p>
      </div>
      <div className="space-y-2 bg-ink p-5">
        <span className="inline-block bg-gold px-3 py-1.5 text-sm font-bold text-ink">gold: fill</span>
        <p className="text-gold-300">gold-300: gold as text on ink (AA)</p>
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Colors',
  parameters: { backgrounds: { disable: true } },
  decorators: [(Story) => <div className="bg-ink p-6"><Story /></div>],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const toHex = (rgb: string) =>
  '#' +
  (rgb.match(/\d+/g) ?? [])
    .slice(0, 3)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

export const Palette_: Story = {
  name: 'Palette',
  render: () => <Palette />,
  play: async ({ canvasElement }) => {
    for (const c of palette) {
      const el = canvasElement.querySelector<HTMLElement>(`[data-token="${c.name}"]`)!;
      await expect(toHex(getComputedStyle(el).backgroundColor)).toBe(c.hex.toUpperCase());
    }
  },
};

/** Crimson and gold each come as a fill colour and a lighter, AA-passing text colour. */
export const FillVsText: Story = {
  render: () => <FillTextSplit />,
};
