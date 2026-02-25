import type { Meta, StoryObj } from '@storybook/react';

import { Label } from './label';
import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Type your message...',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled',
    disabled: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid gap-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message..." />
    </div>
  ),
};
