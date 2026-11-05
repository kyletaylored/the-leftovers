import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import CountryCombobox from './CountryCombobox';

const meta = {
  component: CountryCombobox,
  tags: ['ai-generated'],
  args: { id: 'country', name: 'country', required: true, languages: [] },
  decorators: [
    (Story) => (
      <form className="max-w-sm pb-80" onSubmit={(e) => e.preventDefault()}>
        <label className="field-label" htmlFor="country">
          Country
        </label>
        <Story />
      </form>
    ),
  ],
} satisfies Meta<typeof CountryCombobox>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing to guess from: empty, suggestions first when opened. */
export const Empty: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: /country/i });
    await expect(input).toHaveValue('');
    await userEvent.click(input);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const suggested = canvas.getByRole('group', { name: /suggested/i });
    const first = within(suggested).getAllByRole('option').slice(0, 2).map((o) => o.textContent);
    await expect(first).toEqual(['United States', 'Canada']);
  },
};

/** Pre-filled from the browser language ("en-GB" -> United Kingdom). */
export const GuessedFromLanguage: Story = {
  args: { languages: ['en-GB', 'en'] },
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: /country/i });
    await expect(input).toHaveValue('United Kingdom');
    const hidden = canvasElement.querySelector<HTMLInputElement>('input[type=hidden][name=country]');
    await expect(hidden?.value).toBe('United Kingdom');
  },
};

/** A bare language uses its likely region: "de" -> Germany. */
export const GuessedFromBareLanguage: Story = {
  args: { languages: ['de'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: /country/i })).toHaveValue('Germany');
  },
};

/** Type to filter, arrow to the match, Enter picks it. */
export const SearchAndPick: Story = {
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: /country/i });
    await userEvent.click(input);
    await userEvent.type(input, 'neth');
    const options = canvas.getAllByRole('option');
    await expect(options[0]).toHaveTextContent('Netherlands');
    await expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('Netherlands');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    const hidden = canvasElement.querySelector<HTMLInputElement>('input[type=hidden][name=country]');
    await expect(hidden?.value).toBe('Netherlands');
  },
};

/** Aliases resolve on blur ("usa" -> United States); nonsense is invalid. */
export const AliasesAndValidation: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: /country/i }) as HTMLInputElement;
    await userEvent.type(input, 'usa');
    await userEvent.tab();
    await expect(input).toHaveValue('United States');
    await expect(input.validity.valid).toBe(true);

    await userEvent.clear(input);
    await userEvent.type(input, 'Atlantis');
    await userEvent.tab();
    await expect(input.validity.valid).toBe(false);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText(/choose a country from the list/i)).toBeInTheDocument();
  },
};
