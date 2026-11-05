import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import ChecklistDropdown from './ChecklistDropdown';

const meta = {
  component: ChecklistDropdown,
  tags: ['ai-generated'],
  args: {
    id: 'demo-format',
    name: 'format',
    label: 'Playing format requested',
    options: ['3v3', '5v5', 'X-Ball', '10v10'],
  },
} satisfies Meta<typeof ChecklistDropdown>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Answers stay in option order, however they were ticked. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const field = canvas.getByRole('button', { name: /playing format requested/i });
    await expect(field).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(field);
    const list = within(canvas.getByRole('group', { name: /playing format requested/i }));
    await userEvent.click(list.getByRole('checkbox', { name: '10v10' }));
    await userEvent.click(list.getByRole('checkbox', { name: '3v3' }));
    await expect(field).toHaveAccessibleName(/3v3, 10v10/);

    await userEvent.keyboard('{Escape}');
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await expect(field).toHaveFocus();
  },
};

export const Preselected: Story = {
  args: { defaultValue: ['5v5', 'X-Ball'], hint: 'Tick as many as you’d play.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /5v5, X-Ball/ })).toBeVisible();
  },
};

/** A closed list still submits its ticks, and an empty one blocks with a message. */
export const RequiredInForm: Story = {
  args: { required: true, requiredMessage: 'Pick at least one format.' },
  render: (args) => (
    <form aria-label="Demo" onSubmit={(event) => event.preventDefault()}>
      <ChecklistDropdown {...args} />
      <button type="submit">Send</button>
    </form>
  ),
  play: async ({ canvas, canvasElement }) => {
    const form = canvas.getByRole('form', { name: 'Demo' }) as HTMLFormElement;
    await expect(form.checkValidity()).toBe(false);

    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(await canvas.findByText('Pick at least one format.')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: /playing format requested/i }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'X-Ball' }));
    await userEvent.click(canvasElement.ownerDocument.body);
    await expect(canvas.getByRole('button', { name: /playing format requested/i })).toHaveAttribute('aria-expanded', 'false');

    await expect(form.checkValidity()).toBe(true);
    await expect(new FormData(form).getAll('format')).toEqual(['X-Ball']);
    await expect(canvas.queryByText('Pick at least one format.')).toBeNull();
  },
};
