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
