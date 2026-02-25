'use client';

import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@bowerbird-poc/ui/lib/utils';

interface StepperStep {
  label: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
}

function StepperDot({
  step,
  currentStep,
  icon,
  label,
  isLast,
}: {
  step: number;
  currentStep: number;
  icon?: React.ReactNode;
  label: string;
  isLast: boolean;
}) {
  const isCompleted = currentStep > step;
  const isCurrent = currentStep === step;
  const isPending = currentStep < step;

  return (
    <>
      <div className="flex flex-1 flex-col items-center gap-2">
        <div
          className={cn(
            'flex items-center justify-center rounded-full transition-all',
            isCurrent &&
              'border-primary/20 bg-primary -mt-2 size-10 border-4 text-white shadow-lg shadow-primary/30',
            isCompleted && 'bg-primary size-6 text-white',
            isPending && 'size-6 bg-gray-200 text-gray-400',
          )}
        >
          {isCompleted && <Check className="size-3" />}
          {isCurrent && icon}
        </div>
        <span
          className={cn(
            'text-center text-[11px] font-bold',
            isCurrent && 'text-primary',
            isPending && 'text-gray-400',
          )}
        >
          {label}
        </span>
      </div>
      {!isLast && (
        <div
          className={cn('h-0.5 flex-grow', currentStep > step ? 'bg-primary' : 'bg-gray-200')}
        />
      )}
    </>
  );
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-center justify-between px-2', className)}>
      {steps.map((step, idx) => (
        <StepperDot
          key={idx}
          step={idx + 1}
          currentStep={currentStep}
          icon={step.icon}
          label={step.label}
          isLast={idx === steps.length - 1}
        />
      ))}
    </div>
  );
}
