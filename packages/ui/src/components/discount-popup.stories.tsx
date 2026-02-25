import type { Meta, StoryObj } from '@storybook/react';

import { DiscountPopup } from './discount-popup';

const meta: Meta<typeof DiscountPopup> = {
  title: 'Components/DiscountPopup',
  component: DiscountPopup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    delay: 0,
    storageKey: 'storybook_discount_demo',
  },
};

export const CustomCode: Story = {
  args: {
    delay: 0,
    discountCode: 'SAVE10',
    heading: 'Wait! Special offer',
    body: 'Take 10% off your first order with this exclusive code.',
    storageKey: 'storybook_discount_custom',
  },
};
