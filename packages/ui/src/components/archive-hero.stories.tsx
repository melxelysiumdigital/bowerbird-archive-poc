import type { Meta, StoryObj } from '@storybook/react';

import { ArchiveHero } from './archive-hero';

const meta: Meta<typeof ArchiveHero> = {
  title: 'Components/ArchiveHero',
  component: ArchiveHero,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomText: Story = {
  args: {
    tagline: 'Since 1924',
    headingLine1: 'Discover',
    headingLine2: 'History.',
    description: 'Browse our collection of rare historical documents and archival materials.',
    primaryCtaText: 'Browse Now',
    secondaryCtaText: 'Learn More',
    secondaryCtaUrl: '/about',
  },
};

export const NoCTAs: Story = {
  args: {
    primaryCtaText: '',
    secondaryCtaText: '',
  },
};

export const NoImage: Story = {
  args: {
    imageUrl: '',
  },
};
