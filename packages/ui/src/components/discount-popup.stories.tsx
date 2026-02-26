import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

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
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(within(dialog).getByText('BOWERBIRD5')).toBeVisible();

    const copyButton = within(dialog).getByRole('button', { name: /Copy discount code/i });
    await userEvent.click(copyButton);

    const continueButton = within(dialog).getByRole('button', { name: /Continue shopping/i });
    await userEvent.click(continueButton);
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
  play: async () => {
    const body = within(document.body);
    await body.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
  },
};
