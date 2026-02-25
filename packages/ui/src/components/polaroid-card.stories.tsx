import type { Meta, StoryObj } from '@storybook/react';

import { PolaroidCard, SkeletonCard } from './polaroid-card';

const meta: Meta<typeof PolaroidCard> = {
  title: 'Components/PolaroidCard',
  component: PolaroidCard,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'light-gray', values: [{ name: 'light-gray', value: '#f5f5f5' }] },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseItem = {
  id: '1',
  title: 'War Service Records — Personnel Files',
  description: 'Service records from the Australian Imperial Force during WWI',
  shortDescription: 'WWI AIF service records',
  category: 'Military Records',
  tags: ['WWI', 'Personnel'],
  series: 'B2455',
  controlSymbol: 'SMITH J',
  barcode: '123456',
  release: '2020',
  score: 1,
  specs: { pages: '42', dimensions: 'A4', resolution: '300 DPI', format: 'PDF' },
};

export const ForSale: Story = {
  args: {
    item: {
      ...baseItem,
      itemType: 'document',
      image: 'https://placehold.co/300x400/e2d8c8/594a3a?text=Document',
      forSale: true,
      price: '$24.99',
    },
  },
};

export const DigitisationOnly: Story = {
  args: {
    item: {
      ...baseItem,
      itemType: 'photograph',
      image: 'https://placehold.co/300x400/d4c5a9/594a3a?text=Photo',
      forSale: false,
      price: '',
    },
  },
};

export const NoImage: Story = {
  args: {
    item: {
      ...baseItem,
      itemType: 'map',
      image: '',
      forSale: true,
      price: '$49.99',
    },
  },
};

export const FilmType: Story = {
  args: {
    item: {
      ...baseItem,
      title: 'RAAF Training Footage 1943',
      category: 'Film & Audio',
      itemType: 'film',
      image: 'https://placehold.co/300x400/2a2a2a/cccccc?text=Film',
      forSale: false,
      price: '',
    },
  },
};

export const Skeleton: Story = {
  render: () => (
    <div className="w-72">
      <SkeletonCard />
    </div>
  ),
};

export const Grid: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="grid w-[900px] grid-cols-3 gap-8">
      <PolaroidCard
        item={{
          ...baseItem,
          itemType: 'document',
          image: 'https://placehold.co/300x400/e2d8c8/594a3a?text=1',
          forSale: true,
          price: '$24.99',
        }}
      />
      <PolaroidCard
        item={{
          ...baseItem,
          id: '2',
          title: 'Harbour Bridge Photos',
          itemType: 'photograph',
          image: 'https://placehold.co/300x400/d4c5a9/594a3a?text=2',
          forSale: false,
          price: '',
        }}
      />
      <SkeletonCard />
    </div>
  ),
};
