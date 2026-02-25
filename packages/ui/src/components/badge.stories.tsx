import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Badge',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Badge',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Badge',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Badge',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Badge',
    variant: 'link',
  },
};
