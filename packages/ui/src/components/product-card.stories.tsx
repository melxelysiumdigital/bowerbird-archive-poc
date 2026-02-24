import type { Meta, StoryObj } from '@storybook/react';

import { Card, CardContent, CardFooter } from './card';
import { ProductCard } from './product-card';
import { Skeleton } from './skeleton';

const meta: Meta<typeof ProductCard> = {
  title: 'Components/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Classic Cotton Tee',
    price: '$29.99',
    vendor: 'Bowerbird',
    url: '#',
  },
};

export const WithImage: Story = {
  args: {
    title: 'Vintage Denim Jacket',
    price: '$89.00',
    vendor: 'Archive Co.',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80',
    url: '#',
  },
};

export const OnSale: Story = {
  args: {
    title: 'Linen Summer Shirt',
    price: '$39.99',
    compareAtPrice: '$59.99',
    vendor: 'Bowerbird',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
    badge: 'Sale',
    url: '#',
  },
};

export const WithBadge: Story = {
  args: {
    title: 'Limited Edition Hoodie',
    price: '$120.00',
    vendor: 'Archive Co.',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80',
    badge: 'New',
    url: '#',
  },
};

export const SoldOut: Story = {
  args: {
    title: 'Rare Vintage Piece',
    price: '$250.00',
    vendor: 'Bowerbird',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80',
    available: false,
    url: '#',
  },
};

export const SkeletonLoading: Story = {
  render: () => (
    <Card className="pt-0">
      <Skeleton className="aspect-square w-full rounded-t-xl rounded-b-none" />
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-5 w-20" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-8 w-full rounded-md" />
      </CardFooter>
    </Card>
  ),
};
