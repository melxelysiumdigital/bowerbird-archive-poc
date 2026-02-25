import type { Meta, StoryObj } from '@storybook/react';

import { PriceDisplay } from './price-display';

const meta: Meta<typeof PriceDisplay> = {
  title: 'Components/PriceDisplay',
  component: PriceDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    currencyCode: {
      control: 'select',
      options: ['AUD', 'USD', 'GBP', 'EUR'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    price: 24.99,
  },
};

export const StringPrice: Story = {
  args: {
    price: '149.00',
  },
};

export const WithCompareAt: Story = {
  args: {
    price: 19.99,
    compareAtPrice: 29.99,
  },
};

export const WithQuantity: Story = {
  args: {
    price: 14.99,
    quantity: 3,
  },
};

export const USD: Story = {
  args: {
    price: 34.99,
    currencyCode: 'USD',
  },
};

export const GBP: Story = {
  args: {
    price: 24.99,
    currencyCode: 'GBP',
  },
};

export const AllFeatures: Story = {
  args: {
    price: 12.5,
    compareAtPrice: 25.0,
    quantity: 2,
    currencyCode: 'AUD',
  },
};
