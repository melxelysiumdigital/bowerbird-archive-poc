import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
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
    placeholder: 'Enter text...',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Email address',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Password',
  },
};

export const File: Story = {
  args: {
    type: 'file',
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
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="Email address" />
    </div>
  ),
};
