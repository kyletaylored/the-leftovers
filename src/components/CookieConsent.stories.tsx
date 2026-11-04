import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import CookieConsent from './CookieConsent';

const meta = {
  component: CookieConsent,
  tags: ['ai-generated'],
  args: {
    position: 'inline',
    disableScriptLoad: true,
    showManageWhenDecided: true,
  },
} satisfies Meta<typeof CookieConsent>;
export default meta;
type Story = StoryObj<typeof meta>;

export const UndecidedBanner: Story = {
  args: {
    initialChoice: 'undecided',
    storageKey: 'storybook_cookie_consent_undecided',
  },
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: /cookie and analytics preferences/i });
    await expect(region).toBeVisible();

    const acceptBtn = canvas.getByRole('button', { name: /accept analytics/i });
    const essentialBtn = canvas.getByRole('button', { name: /essential only/i });
    await expect(acceptBtn).toBeVisible();
    await expect(essentialBtn).toBeVisible();

    await userEvent.click(acceptBtn);
    await expect(canvas.getByText(/analytics enabled/i)).toBeVisible();

    const changeBtn = canvas.getByRole('button', { name: /change preferences/i });
    await userEvent.click(changeBtn);
    await expect(canvas.getByRole('button', { name: /essential only/i })).toBeVisible();
  },
};

export const EssentialOnlySaved: Story = {
  args: {
    initialChoice: 'declined',
    storageKey: 'storybook_cookie_consent_declined',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/essential only \(no analytics\)/i)).toBeVisible();
  },
};

export const AnalyticsAcceptedSaved: Story = {
  args: {
    initialChoice: 'accepted',
    storageKey: 'storybook_cookie_consent_accepted',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/analytics enabled/i)).toBeVisible();
  },
};
