import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import Slideshow, { type Slide } from './Slideshow';

const slides: Slide[] = [
  { src: 'https://picsum.photos/seed/leftovers-1/800/600', width: 800, height: 600, alt: 'Game day, huddle before points', caption: 'Winter Classic — Day 1' },
  { src: 'https://picsum.photos/seed/leftovers-2/800/600', width: 800, height: 600, alt: 'Field walk-through', caption: 'Winter Classic — Day 2' },
  { src: 'https://picsum.photos/seed/leftovers-3/800/600', width: 800, height: 600, alt: 'Post-event team photo' },
];

const meta = {
  component: Slideshow,
  tags: ['ai-generated'],
} satisfies Meta<typeof Slideshow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { slides },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /go to slide 1/i })).toHaveAttribute(
      'aria-current',
      'true'
    );
  },
};

export const SingleSlide: Story = {
  args: { slides: slides.slice(0, 1) },
};

// --- Variants (design storybook §04.5; mirrored on /design#marketing) ---

/** One image at a time, crimson caption flag, dash indicators. */
export const SingleWithFlag: Story = {
  args: { slides, layout: 'single', captionStyle: 'flag' },
};

/** Thumbnail strip instead of dashes — when the shots are worth previewing. */
export const Thumbnails: Story = {
  args: { slides, layout: 'single', captionStyle: 'flag', indicators: 'thumbnails' },
  play: async ({ canvas, userEvent }) => {
    const second = canvas.getByRole('button', { name: /go to slide 2/i });
    await expect(canvas.getByRole('button', { name: /go to slide 1/i })).toHaveAttribute(
      'aria-current',
      'true'
    );
    await userEvent.click(second);
    await expect(second).toHaveAttribute('aria-current', 'true');
  },
};

/** Full-width 16:7 hero/section slider — arrows, flag and dashes on the image. */
export const Hero: Story = {
  args: { slides, layout: 'hero' },
  parameters: { layout: 'fullscreen' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /next slide/i })).toBeVisible();
  },
};
