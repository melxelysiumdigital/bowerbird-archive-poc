import type { Meta, StoryObj } from '@storybook/react';

import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
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
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    value: 0,
    'aria-label': 'Progress',
  },
};

export const Half: Story = {
  args: {
    value: 50,
    'aria-label': 'Progress',
  },
};

export const Full: Story = {
  args: {
    value: 100,
    'aria-label': 'Progress',
  },
};

export const Default: Story = {
  args: {
    value: 33,
    'aria-label': 'Progress',
  },
};
