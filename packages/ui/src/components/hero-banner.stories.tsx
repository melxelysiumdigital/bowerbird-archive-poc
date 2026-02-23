import type { Meta, StoryObj } from '@storybook/react';

import { HeroBanner } from './hero-banner';
import { Skeleton } from './skeleton';

const meta: Meta<typeof HeroBanner> = {
  title: 'Components/HeroBanner',
  component: HeroBanner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    textAlignment: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    overlayOpacity: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Welcome to Our Store',
    subheading: 'Discover our curated collection of unique pieces',
  },
};

export const WithImage: Story = {
  args: {
    heading: 'Summer Collection',
    subheading: 'Fresh styles for the season',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    overlayOpacity: 40,
  },
};

export const WithCTA: Story = {
  args: {
    heading: 'New Arrivals',
    subheading: 'Check out what just landed',
    ctaText: 'Shop Now',
    ctaUrl: '/collections/new',
  },
};

export const FullFeatured: Story = {
  args: {
    heading: 'End of Season Sale',
    subheading: 'Up to 50% off selected items',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    ctaText: 'Shop Sale',
    ctaUrl: '/collections/sale',
    overlayOpacity: 50,
    textAlignment: 'center',
  },
};

export const LeftAligned: Story = {
  args: {
    heading: 'Curated for You',
    subheading: 'Handpicked selections from our archive',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    ctaText: 'Browse Collection',
    ctaUrl: '/collections/curated',
    textAlignment: 'left',
  },
};

export const RightAligned: Story = {
  args: {
    heading: 'Limited Edition',
    subheading: 'Exclusive drops you won\'t find anywhere else',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    ctaText: 'Shop Exclusives',
    ctaUrl: '/collections/limited',
    textAlignment: 'right',
  },
};

export const SkeletonLoading: Story = {
  render: () => (
    <section className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden bg-muted">
      <Skeleton className="absolute inset-0" />
      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-4 px-6 py-16">
        <Skeleton className="h-12 w-96 rounded-md" />
        <Skeleton className="h-6 w-72 rounded-md" />
        <Skeleton className="mt-2 h-10 w-32 rounded-md" />
      </div>
    </section>
  ),
};
