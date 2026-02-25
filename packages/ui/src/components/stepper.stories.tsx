import type { Meta, StoryObj } from '@storybook/react';
import { FileSearch, FileText, CreditCard, ScanLine, Download, CircleCheckBig } from 'lucide-react';

import { Stepper } from './stepper';

const meta: Meta<typeof Stepper> = {
  title: 'Components/Stepper',
  component: Stepper,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const digitisationSteps = [
  { label: 'Submitted', icon: <CircleCheckBig className="size-4" /> },
  { label: 'Review', icon: <FileSearch className="size-4" /> },
  { label: 'Quote', icon: <FileText className="size-4" /> },
  { label: 'Payment', icon: <CreditCard className="size-4" /> },
  { label: 'Digitising', icon: <ScanLine className="size-4" /> },
  { label: 'Complete', icon: <Download className="size-4" /> },
];

export const AtStart: Story = {
  args: {
    steps: digitisationSteps,
    currentStep: 1,
  },
};

export const MidProgress: Story = {
  args: {
    steps: digitisationSteps,
    currentStep: 3,
  },
};

export const NearComplete: Story = {
  args: {
    steps: digitisationSteps,
    currentStep: 5,
  },
};

export const AllComplete: Story = {
  args: {
    steps: digitisationSteps,
    currentStep: 7,
  },
};

export const ThreeSteps: Story = {
  args: {
    steps: [
      { label: 'Start' },
      { label: 'Process' },
      { label: 'Done' },
    ],
    currentStep: 2,
  },
};
