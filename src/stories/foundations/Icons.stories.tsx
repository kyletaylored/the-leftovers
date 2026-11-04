import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { FILLED_ICONS, STROKED_ICONS, filledIconNames, strokedIconNames } from '@/lib/icons';

/**
 * Foundations / Icons: every glyph in src/lib/icons.ts, drawn with the same
 * SVG attributes as Icon.astro (24×24, 1.8 stroke, round caps, currentColor).
 * On the site, use <Icon name="…" /> from src/components/brand/Icon.astro.
 * This story is the catalogue, not a React icon component.
 */
function Glyph({ name, filled }: { name: string; filled: boolean }) {
  const d = filled
    ? FILLED_ICONS[name as keyof typeof FILLED_ICONS]
    : STROKED_ICONS[name as keyof typeof STROKED_ICONS];
  return (
    <li className="flex flex-col items-center gap-1.5 border border-ink-600 bg-ink-800 px-1 py-3">
      <svg
        viewBox="0 0 24 24"
        className="size-[26px] text-gold"
        fill={filled ? 'currentColor' : 'none'}
        stroke={filled ? 'none' : 'currentColor'}
        strokeWidth={filled ? undefined : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={d} />
      </svg>
      <span className="text-[0.625rem] text-bone-muted">{name}</span>
    </li>
  );
}

function Grid({ names, filled }: { names: readonly string[]; filled: boolean }) {
  return (
    <ul aria-label={filled ? 'Filled icons' : 'Stroked icons'} className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2.5">
      {names.map((n) => (
        <Glyph key={n} name={n} filled={filled} />
      ))}
    </ul>
  );
}

const meta = {
  title: 'Foundations/Icons',
  decorators: [(Story) => <div className="bg-ink p-6"><Story /></div>],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Stroked: Story = {
  render: () => <Grid names={strokedIconNames} filled={false} />,
  play: async ({ canvas }) => {
    const list = canvas.getByRole('list', { name: 'Stroked icons' });
    await expect(list.querySelectorAll('li')).toHaveLength(strokedIconNames.length);
  },
};

export const Filled: Story = {
  render: () => <Grid names={filledIconNames} filled />,
};
