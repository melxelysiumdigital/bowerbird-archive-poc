import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button>Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Popover Title">
        <PopoverHeader>
          <PopoverTitle>Popover Title</PopoverTitle>
          <PopoverDescription>This is a popover description.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverAnchor asChild>
        <div className="mx-auto w-fit">
          <PopoverTrigger asChild>
            <Button>Open Popover</Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent aria-label="Name form">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Enter your name" />
        </div>
      </PopoverContent>
    </Popover>
  ),
};
