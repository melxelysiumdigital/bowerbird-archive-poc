import type { Meta, StoryObj } from '@storybook/react';

import { NewsletterSignup } from './newsletter-signup';

const meta: Meta<typeof NewsletterSignup> = {
  title: 'Components/NewsletterSignup',
  component: NewsletterSignup,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomText: Story = {
  args: {
    heading: 'Stay in the Loop',
    description: 'Subscribe to our newsletter for the latest updates and exclusive offers.',
    buttonText: 'Sign Up',
    placeholder: 'your@email.com',
  },
};
