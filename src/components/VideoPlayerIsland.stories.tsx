import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import VideoPlayerIsland from './VideoPlayerIsland';

/*
 * Uses the real promo from public/video (Storybook serves public/). The play
 * tests fire the media events themselves rather than playing the file, so
 * they pass in a headless browser that can't decode H.264.
 */
const meta = {
  component: VideoPlayerIsland,
  tags: ['ai-generated'],
  args: {
    src: '/video/nxl-world-cup-promo.mp4',
    poster: '/og-default.png',
    title: 'Want to play but need a team?',
    captions: '/video/nxl-world-cup-promo.vtt',
    captionsLang: 'en',
    captionsLabel: 'English',
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideoPlayerIsland>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Before play: the poster and the crimson play button. Native controls are off once hydrated. */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('button', { name: 'Play video: Want to play but need a team?' })).toBeVisible();
    const video = canvasElement.querySelector('video')!;
    await expect(video.controls).toBe(false);
  },
};

/** Started: the control bar, with captions on and toggled by the button or the C key. */
export const Playing: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const video = canvasElement.querySelector('video')!;
    fireEvent.play(video);
    const cc = await canvas.findByRole('button', { name: 'Captions' });
    await expect(cc).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(canvas.getByRole('slider', { name: 'Seek' })).toBeInTheDocument();

    await userEvent.click(cc);
    await expect(cc).toHaveAttribute('aria-pressed', 'false');
    await userEvent.keyboard('c');
    await expect(cc).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Mute follows the video's own state. */
export const Mute: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const video = canvasElement.querySelector('video')!;
    fireEvent.play(video);
    await userEvent.click(await canvas.findByRole('button', { name: 'Mute' }));
    await waitFor(() => expect(video.muted).toBe(true));
    await expect(canvas.getByRole('button', { name: 'Unmute' })).toBeVisible();
  },
};

/** captionsOn false: the CC button starts off (for videos with subtitles in the picture). */
export const CaptionsOffAtStart: Story = {
  args: { captionsOn: false },
  play: async ({ canvas, canvasElement }) => {
    fireEvent.play(canvasElement.querySelector('video')!);
    await expect(await canvas.findByRole('button', { name: 'Captions' })).toHaveAttribute('aria-pressed', 'false');
  },
};

/** No captions file: no CC button. */
export const NoCaptions: Story = {
  args: { captions: undefined },
  play: async ({ canvas, canvasElement }) => {
    fireEvent.play(canvasElement.querySelector('video')!);
    await canvas.findByRole('button', { name: 'Full screen' });
    await expect(canvas.queryByRole('button', { name: 'Captions' })).toBeNull();
  },
};
