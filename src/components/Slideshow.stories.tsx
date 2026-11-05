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

// --- Nov 2026: per-slide kicker + headline, and the showcase layout ---

const posterSlides: Slide[] = [
  { src: 'https://picsum.photos/seed/leftovers-4/1600/1000', width: 1600, height: 1000, alt: 'Players sprint off the break', caption: 'Off the break', kicker: 'NXL · 2026' },
  { src: 'https://picsum.photos/seed/leftovers-5/1600/1000', width: 1600, height: 1000, alt: 'A team huddle', caption: 'Lock in', kicker: 'NXL · 2025' },
  { src: 'https://picsum.photos/seed/leftovers-6/1600/1000', width: 1600, height: 1000, alt: 'Team photo under a tent', kicker: 'Game day' },
];

/** Flag carries the per-slide caption with its kicker above; grows on desktop. */
export const FlagWithKicker: Story = {
  args: { slides: posterSlides, layout: 'single', captionStyle: 'flag' },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('Off the break')[0]).toBeInTheDocument();
    await expect(canvas.getAllByText('NXL · 2026')[0]).toBeInTheDocument();
  },
};

/** Full-bleed poster slider: headline per slide, counter, progress bars. */
export const Showcase: Story = {
  args: { slides: posterSlides, layout: 'showcase' },
  parameters: { layout: 'fullscreen' },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Off the break')).toBeInTheDocument();
    const second = canvas.getByRole('button', { name: /go to slide 2/i });
    await userEvent.click(canvas.getByRole('button', { name: /next slide/i }));
    await expect(second).toHaveAttribute('aria-current', 'true');
    // No autoplay, so no pause control.
    await expect(canvas.queryByRole('button', { name: /pause slideshow/i })).toBeNull();
  },
};

/** With autoplay: a visible pause/play toggle (WCAG 2.2.2). */
export const ShowcaseAutoplay: Story = {
  args: { slides: posterSlides, layout: 'showcase', autoplayMs: 6000 },
  parameters: { layout: 'fullscreen' },
  play: async ({ canvas, userEvent }) => {
    const pause = await canvas.findByRole('button', { name: /pause slideshow/i });
    await userEvent.click(pause);
    await expect(canvas.getByRole('button', { name: /play slideshow/i })).toBeVisible();
  },
};

/** Overlay tone (showcase only): crimson, matching ImpactBand tone="crimson". */
export const ShowcaseCrimson: Story = {
  args: { slides: posterSlides, layout: 'showcase', tone: 'crimson' },
  parameters: { layout: 'fullscreen' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Off the break')).toBeInTheDocument();
  },
};

const manySlides: Slide[] = Array.from({ length: 10 }, (_, index) => ({
  src: `https://picsum.photos/seed/leftovers-grid-${index}/800/600`,
  thumbSrc: `https://picsum.photos/seed/leftovers-grid-${index}/160/120`,
  width: 800,
  height: 600,
  alt: `Sample photo ${index + 1}`,
}));

/** Paged thumbnail grid for browsing many photos, as on /gallery. */
export const GridWithPager: Story = {
  args: { slides: manySlides, layout: 'single', indicators: 'grid', pageSize: 4, captionStyle: 'flag' },
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Lazy: only the first photo and its neighbours are mounted.
    await expect(canvasElement.querySelectorAll('figure img')).toHaveLength(3);
    await expect(canvas.queryByRole('button', { name: /go to slide 5/i })).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: /next page of photos/i }));
    const fifth = await canvas.findByRole('button', { name: /go to slide 5/i });
    await expect(canvas.queryByRole('button', { name: /go to slide 1$/i })).toBeNull();

    await userEvent.click(fifth);
    await expect(fifth).toHaveAttribute('aria-current', 'true');
    await expect(canvas.getByText(/photo 5 of 10/i)).toBeVisible();
    await expect(canvasElement.querySelectorAll('figure img').length).toBeGreaterThan(3);
  },
};
