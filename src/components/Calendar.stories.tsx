import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import Calendar, { type CalendarEvent } from './Calendar';

const events: CalendarEvent[] = [
  {
    slug: 'winter-classic',
    title: 'Winter Classic',
    startDate: '2026-01-17',
    endDate: '2026-01-18',
    upcoming: true,
  },
  {
    slug: 'spring-invite',
    title: 'Spring Invite',
    startDate: '2026-01-24',
    endDate: '2026-01-24',
    upcoming: true,
  },
];

const meta = {
  component: Calendar,
  tags: ['ai-generated'],
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithEvents: Story = {
  args: { events, initialMonth: '2026-01-01' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /17: Winter Classic/i })).toBeVisible();
  },
};

export const Empty: Story = {
  args: { events: [], initialMonth: '2026-01-01' },
};
