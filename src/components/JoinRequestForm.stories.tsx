import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import JoinRequestForm from './JoinRequestForm';

const meta = {
  component: JoinRequestForm,
  tags: ['ai-generated'],
} satisfies Meta<typeof JoinRequestForm>;
export default meta;
type Story = StoryObj<typeof meta>;

// No `endpoint` = handoff mode: the request is formatted for the player to
// send themselves, so there's no network call to mock.
export const Handoff: Story = {
  args: {
    events: [
      { id: '2026-11-series-finals', label: 'Series Finals — Nov 14–15' },
      { id: 'any', label: 'Any upcoming event' },
    ],
    paymentMethods: [],
    teamEmail: 'crew@theleftoverspb.com',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /send join request/i })).toBeEnabled();
  },
};
