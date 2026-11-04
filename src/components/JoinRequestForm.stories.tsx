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
      { id: 'NXL World Cup 2026', label: 'NXL World Cup 2026' },
    ],
    paymentMethods: [],
    teamEmail: 'crew@theleftoverspb.com',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /send join request/i })).toBeEnabled();
  },
};

// The option lists mirror the Google Form's wording (docs/JOIN.md). If the
// form changes, this is the test to update alongside it.
export const FormOptions: Story = {
  args: Handoff.args,
  play: async ({ canvas }) => {
    const options = (name: RegExp) =>
      [...(canvas.getByLabelText(name) as HTMLSelectElement).options].map((o) => o.text);

    await expect(options(/current player ranking/i)).toContain('Beginner / Unranked');
    await expect(options(/playing format requested/i)).toEqual([
      'Choose one…',
      '3v3',
      '5v5',
      'X-Ball',
      '10v10',
      'Mechanical',
    ]);
    // Country is free text and Facebook is optional, as on the form.
    await expect(canvas.getByLabelText(/^country/i)).toHaveAttribute('type', 'text');
    await expect(canvas.getByLabelText(/facebook profile link/i)).not.toBeRequired();
  },
};
