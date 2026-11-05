import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
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
    // Country is a searchable picker (posted as text, which the form's short
    // answer accepts); Facebook is optional, as on the form.
    await expect(canvas.getByRole('combobox', { name: /^country/i })).toBeRequired();
    await expect(canvas.getByLabelText(/facebook profile link/i)).not.toBeRequired();

    const answers = async (name: RegExp) => {
      await userEvent.click(canvas.getByRole('button', { name }));
      const list = within(canvas.getByRole('group', { name }));
      return list.getAllByRole('checkbox').map((c) => (c as HTMLInputElement).value);
    };
    await expect(await answers(/playing format requested/i)).toEqual(['3v3', '5v5', 'X-Ball', '10v10', 'Mechanical']);
    await expect(await answers(/preferred position/i)).toEqual([
      'Snake Front',
      'Snake Support',
      'Dorito Front',
      'Dorito Support',
      'Home / Fill',
      'Middle',
      'Versatile / Any',
    ]);
  },
};

// Both checklists are required: at least one tick each, and more is fine.
export const ChecklistsRequired: Story = {
  args: Handoff.args,
  play: async ({ canvas, canvasElement }) => {
    const proxy = (name: string) =>
      canvasElement.querySelector(`[data-checklist-proxy="${name}"]`) as HTMLInputElement;
    await expect(proxy('teamSize').validity.valid).toBe(false);
    await expect(proxy('position').validity.valid).toBe(false);

    await userEvent.click(canvas.getByRole('button', { name: /preferred position/i }));
    const group = within(canvas.getByRole('group', { name: /preferred position/i }));
    await userEvent.click(group.getByRole('checkbox', { name: 'Middle' }));
    await expect(proxy('position').validity.valid).toBe(true);
    await userEvent.click(group.getByRole('checkbox', { name: 'Home / Fill' }));
    await userEvent.click(group.getByRole('checkbox', { name: 'Middle' }));
    await expect(proxy('position').validity.valid).toBe(true);
    await userEvent.click(group.getByRole('checkbox', { name: 'Home / Fill' }));
    await expect(proxy('position').validity.valid).toBe(false);
  },
};
