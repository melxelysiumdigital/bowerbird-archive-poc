import type { SortOption } from '@bowerbird-poc/shared/types';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';

import { SortBar } from './sort-bar';

const meta: Meta<typeof SortBar> = {
  title: 'Components/SortBar',
  component: SortBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function SortBarWithState() {
  const [sort, setSort] = useState<SortOption>('relevance');
  return <SortBar sort={sort} onSortChange={setSort} resultCount={42} />;
}

export const Default: Story = {
  render: () => <SortBarWithState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await userEvent.click(trigger);
    const option = await within(document.body).findByRole('option', { name: /Title A–Z/i });
    await userEvent.click(option);
  },
};

export const Loading: Story = {
  args: {
    sort: 'relevance',
    onSortChange: () => {},
    resultCount: 0,
    isLoading: true,
  },
};

export const NoResults: Story = {
  args: {
    sort: 'relevance',
    onSortChange: () => {},
    resultCount: 0,
  },
};

export const ManyResults: Story = {
  args: {
    sort: 'title_az',
    onSortChange: () => {},
    resultCount: 1247,
  },
};
