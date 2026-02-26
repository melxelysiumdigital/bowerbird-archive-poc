import { EMPTY_FILTERS } from '@bowerbird-poc/shared/constants';
import type { SearchFilters } from '@bowerbird-poc/shared/types';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { FilterSidebar } from './filter-sidebar';

const meta: Meta<typeof FilterSidebar> = {
  title: 'Components/FilterSidebar',
  component: FilterSidebar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  {
    id: '1',
    title: 'War Service Records',
    description: 'Personnel files from WWI',
    shortDescription: 'WWI personnel files',
    category: 'Military Records',
    itemType: 'document' as const,
    tags: ['WWI', 'Personnel', 'Military'],
    image: '',
    forSale: true,
    price: '$24.99',
    series: 'B2455',
    controlSymbol: 'SMITH J',
    barcode: '123456',
    release: '2020',
    score: 1,
    specs: { pages: '42', dimensions: 'A4', resolution: '300 DPI', format: 'PDF' },
  },
  {
    id: '2',
    title: 'Sydney Harbour Bridge Construction',
    description: 'Photographic collection',
    shortDescription: 'Bridge construction photos',
    category: 'Photographs',
    itemType: 'photograph' as const,
    tags: ['Infrastructure', 'Sydney', 'Construction'],
    image: '',
    forSale: false,
    price: '',
    series: 'A1200',
    controlSymbol: 'L38572',
    barcode: '789012',
    release: '2019',
    score: 0.9,
    specs: { pages: '1', dimensions: '10x8"', resolution: '600 DPI', format: 'TIFF' },
  },
  {
    id: '3',
    title: 'Immigration Records 1945',
    description: 'Post-war migration files',
    shortDescription: 'Post-war migration records',
    category: 'Immigration',
    itemType: 'document' as const,
    tags: ['Immigration', 'Post-war', 'Personnel'],
    image: '',
    forSale: true,
    price: '$14.99',
    series: 'A12111',
    controlSymbol: 'MIGRATION',
    barcode: '345678',
    release: '2021',
    score: 0.85,
    specs: { pages: '120', dimensions: 'A4', resolution: '300 DPI', format: 'PDF' },
  },
];

function FilterSidebarWithState() {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  return <FilterSidebar filters={filters} onChange={setFilters} items={sampleItems} />;
}

export const Default: Story = {
  render: () => <FilterSidebarWithState />,
};

export const WithPreselected: Story = {
  args: {
    filters: {
      ...EMPTY_FILTERS,
      itemTypes: ['document'],
      forSaleOnly: true,
    },
    items: sampleItems,
    onChange: () => {},
  },
};

export const EmptyItems: Story = {
  args: {
    filters: EMPTY_FILTERS,
    items: [],
    onChange: () => {},
  },
};
