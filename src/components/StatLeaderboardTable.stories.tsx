import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import StatLeaderboardTable from './StatLeaderboardTable';
import type { PlayerStatRow } from '@/lib/stats';

const row = (overrides: Partial<PlayerStatRow>): PlayerStatRow => ({
  slug: overrides.name?.toLowerCase().replace(/\s+/g, '-') ?? 'player',
  name: 'Player',
  role: 'Snake',
  events: 4,
  gamesPlayed: 12,
  eliminations: 10,
  deaths: 8,
  flagPulls: 2,
  flagHangs: 1,
  penalties: 0,
  kd: 1.25,
  epg: 0.83,
  ...overrides,
});

const rows: PlayerStatRow[] = [
  row({ name: 'Dani Okafor', number: 22, role: 'Snake', eliminations: 41, deaths: 19, kd: 2.16, epg: 3.42 }),
  row({ name: 'Kyle Taylor', number: 7, role: 'Front', eliminations: 28, deaths: 22, kd: 1.27, epg: 2.33 }),
  row({ name: 'A. Velasquez', number: 14, role: 'Back', eliminations: 15, deaths: 20, kd: 0.75, epg: 1.25 }),
];

const meta = {
  component: StatLeaderboardTable,
  tags: ['ai-generated'],
} satisfies Meta<typeof StatLeaderboardTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { rows, roles: ['Snake', 'Front', 'Back'] },
  play: async ({ canvas }) => {
    // Sorts by eliminations descending by default — Dani Okafor (41) leads.
    await expect(canvas.getByText('Dani Okafor')).toBeVisible();
  },
};

export const Empty: Story = {
  args: { rows: [], roles: [] },
};

// The leaderboard leader's <tr> is styled `bg-gold text-ink` (see
// StatLeaderboardTable.tsx line ~208) — a concrete, on-brand computed-style
// assertion that proves the shared preview actually loaded Tailwind/global.css.
export const CssCheck: Story = {
  args: { rows, roles: ['Snake', 'Front', 'Back'] },
  play: async ({ canvas }) => {
    const leaderRow = canvas.getByText('Dani Okafor').closest('tr');
    // --color-gold: #c9a227
    await expect(getComputedStyle(leaderRow!).backgroundColor).toBe('rgb(201, 162, 39)');
  },
};
