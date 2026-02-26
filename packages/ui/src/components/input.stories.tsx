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
    'aria-label': 'Text input',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Email address',
    'aria-label': 'Email address',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Password',
    'aria-label': 'Password',
  },
};

export const File: Story = {
  args: {
    type: 'file',
    'aria-label': 'File upload',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled',
    'aria-label': 'Disabled input',
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
