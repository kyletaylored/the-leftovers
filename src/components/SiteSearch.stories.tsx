import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import SiteSearch from './SiteSearch';
import { demoPagefind } from './site-search-demo';

const meta = {
  component: SiteSearch,
  tags: ['ai-generated'],
  args: { loadPagefind: async () => demoPagefind },
  decorators: [
    (Story) => {
      // Start each story from a clean URL: the island reads and writes ?q=.
      window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&](q|type|category|tag|year)=[^&]*/g, ''));
      return <Story />;
    },
  ],
} satisfies Meta<typeof SiteSearch>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Typing searches every type; the count is announced in the status line. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status');
    await waitFor(() => expect(status).toHaveTextContent(/type to search/i));

    await userEvent.type(canvas.getByRole('searchbox', { name: /search the site/i }), 'practice');
    await waitFor(() => expect(status).toHaveTextContent('3 results for “practice”'));
    await expect(canvas.getByRole('link', { name: 'Join the team' })).toHaveAttribute('href', '/join');
  },
};

/** Picking Blog posts reveals the category/tag/year filters and lists posts newest first. */
export const BrowseBlog: Story = {
  play: async ({ canvas }) => {
    const blog = await canvas.findByRole('button', { name: /blog posts/i });
    await expect(blog).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(blog);
    await expect(blog).toHaveAttribute('aria-pressed', 'true');

    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('3 results.'));
    const links = canvas.getAllByRole('link').map((a) => a.textContent);
    await expect(links[0]).toMatch(/featured recap/);

    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Year' }), '2025');
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('1 result.'));
    await expect(window.location.search).toContain('year=2025');

    // Clearing the type clears the blog-only filters with it.
    await userEvent.click(blog);
    await expect(canvas.queryByRole('combobox', { name: 'Year' })).toBeNull();
  },
};

export const NoMatches: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(await canvas.findByRole('searchbox'), 'zzzz');
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/nothing matches “zzzz”/i));
  },
};

/** No index (e.g. under npm run dev): a clear message instead of a dead box. */
export const Unavailable: Story = {
  args: { loadPagefind: () => Promise.reject(new Error('no index')) },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/npm run build|couldn’t load/));
  },
};
