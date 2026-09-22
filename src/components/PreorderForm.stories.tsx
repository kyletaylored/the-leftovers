import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import PreorderForm from './PreorderForm';

const meta = {
  component: PreorderForm,
  tags: ['ai-generated'],
} satisfies Meta<typeof PreorderForm>;
export default meta;
type Story = StoryObj<typeof meta>;

// Default (no `endpoint`) is "handoff" mode — the form prices and formats
// the order, then hands the finished text back to the buyer. No network
// call, so no MSW handler needed for this story.
export const Handoff: Story = {
  args: {
    campaign: '2026 Pink — Breast Cancer Awareness',
    variants: [{ name: 'Home', description: 'Crimson body, gold trim' }, { name: 'Away', description: 'Ink body, gold trim' }],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    price: 65,
    currency: 'USD',
    nameOnBack: true,
    numberOnBack: true,
    paymentMethods: [{ label: 'Venmo', handle: '@the-leftovers' }],
    teamEmail: 'crew@theleftoverspb.com',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /add another jersey/i })).toBeVisible();
  },
};
