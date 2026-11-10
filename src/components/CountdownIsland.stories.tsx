import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import CountdownIsland, { localTarget } from './CountdownIsland';

// Tomorrow's date in the BROWSER's time zone, as content would store it.
const local = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const meta = {
  component: CountdownIsland,
  tags: ['ai-generated'],
  args: { day: local(1), initialRemaining: 0 },
} satisfies Meta<typeof CountdownIsland>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * An event tomorrow counts to local midnight tonight: always under a day,
 * whatever the time zone. (Counting to UTC midnight is what this guards
 * against: it was hours early everywhere west of Greenwich.)
 */
export const EventTomorrow: Story = {
  play: async ({ canvas, args }) => {
    const target = localTarget(args.day);
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    await expect(target).toBe(midnight.getTime());

    const group = canvas.getByRole('group', { name: /time until/i });
    await waitFor(() => expect(group).toHaveTextContent(/^00Days/));
  },
};

/** A deadline today (endOfDay) is still open until local midnight tonight. */
export const DeadlineToday: Story = {
  args: { day: local(0), endOfDay: true, passedLabel: 'Orders have closed' },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('group', { name: /time until/i })).toBeVisible());
    await expect(canvas.queryByText('Orders have closed')).toBeNull();
  },
};

/** Yesterday's event has passed: the label replaces the clock. */
export const Passed: Story = {
  args: { day: local(-1) },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("It's game day")).toBeVisible());
  },
};
