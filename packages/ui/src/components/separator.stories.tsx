import type { Meta, StoryObj } from '@storybook/react';

import { Separator } from './separator';

const meta = {
  title: 'Components/Separator',
  component: Separator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px]">
      <div className="text-sm">Above</div>
      <Separator className="my-4" />
      <div className="text-sm">Below</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-4 text-sm">
      <div>Left</div>
      <Separator orientation="vertical" />
      <div>Right</div>
    </div>
  ),
};
