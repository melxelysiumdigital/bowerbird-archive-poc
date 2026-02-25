import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../button';

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from './card';

const meta: Meta = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[350px]"><Story /></div>],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with some example text to demonstrate the layout.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>This card has an action button in the header.</p>
      </CardContent>
    </Card>
  ),
};
