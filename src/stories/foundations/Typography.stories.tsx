import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

/**
 * Foundations / Typography: the three type roles. On the site Astro's font
 * API loads them; in Storybook, .storybook/fonts.css does. The play test
 * fails if any face falls back to a system font.
 */
function Roles() {
  return (
    <div className="grid gap-8 sm:grid-cols-3">
      <div>
        <p className="font-marker text-5xl leading-none text-brand-red">The Leftovers</p>
        <p className="mt-2 text-xs text-bone-muted">
          CC Monster Mash Worn · <code>font-marker</code>. Wordmark only, licensed, never body text.
        </p>
      </div>
      <div>
        <h2 className="font-display text-4xl uppercase leading-none text-bone">Meet the Crew</h2>
        <p className="mt-2 text-xs text-bone-muted">
          Anton · <code>font-display</code>. All headings, uppercase, tight leading.
        </p>
      </div>
      <div>
        <p className="eyebrow">Eyebrow · .eyebrow</p>
        <p className="mt-2 font-sans text-base text-bone">Paintball builds better people. Aa Bb Cc 123</p>
        <p className="mt-2 text-xs text-bone-muted">
          Inter · <code>font-sans</code>. Body &amp; UI text, 400–700.
        </p>
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Typography',
  decorators: [(Story) => <div className="bg-ink p-6"><Story /></div>],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const TypeRoles: Story = {
  render: () => <Roles />,
  play: async () => {
    await document.fonts.ready;
    for (const family of ['Anton', 'Inter Variable', 'CC Monster Mash Worn']) {
      await waitFor(async () => {
        await document.fonts.load(`32px "${family}"`);
        await expect(document.fonts.check(`32px "${family}"`)).toBe(true);
        const loaded = [...document.fonts].some((f) => f.family.replace(/"/g, '') === family && f.status === 'loaded');
        await expect(loaded).toBe(true);
      });
    }
  },
};
