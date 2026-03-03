'use client';

import {
  REFTRACKER_STATUS_STYLES,
  REFTRACKER_STEPS,
  REFTRACKER_STATUS_ORDER,
  TECHONE_STATUS_STYLES,
  TECHONE_STEPS,
  TECHONE_STATUS_ORDER,
} from '@bowerbird-poc/shared/constants';
import type { IntegrationState } from '@bowerbird-poc/shared/types';
import { Badge } from '@bowerbird-poc/ui/components/badge';
import { cn } from '@bowerbird-poc/ui/lib/utils';
import { Check, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

function TimelineStep({
  label,
  index,
  currentIndex,
  total,
}: {
  label: string;
  index: number;
  currentIndex: number;
  total: number;
}) {
  const isCompleted = currentIndex > index;
  const isCurrent = currentIndex === index;
  const isPending = currentIndex < index;

  return (
    <>
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={cn(
            'flex items-center justify-center rounded-full transition-all',
            isCurrent && 'bg-primary size-6 text-white shadow',
            isCompleted && 'bg-primary/80 size-4 text-white',
            isPending && 'size-4 bg-gray-200',
          )}
        >
          {isCompleted && <Check className="size-2.5" />}
        </div>
        <span
          className={cn(
            'max-w-[56px] text-center text-[9px] leading-tight',
            isCurrent && 'text-primary font-bold',
            isCompleted && 'text-muted-foreground',
            isPending && 'text-gray-300',
          )}
        >
          {label}
        </span>
      </div>
      {index < total - 1 && (
        <div
          className={cn(
            'mt-[-10px] h-0.5 flex-grow',
            currentIndex > index ? 'bg-primary/60' : 'bg-gray-200',
          )}
        />
      )}
    </>
  );
}

function RefTrackerSection({
  refTracker,
  rtStepIndex,
}: {
  refTracker: NonNullable<IntegrationState['refTracker']>;
  rtStepIndex: number;
}) {
  const [rtOpen, setRtOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setRtOpen(!rtOpen)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">Item Tracking</span>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px]',
              REFTRACKER_STATUS_STYLES[refTracker.status].bg,
              REFTRACKER_STATUS_STYLES[refTracker.status].color,
            )}
          >
            {REFTRACKER_STATUS_STYLES[refTracker.status].label}
          </Badge>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3" />
            {refTracker.location}
          </span>
        </div>
        {rtOpen ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </button>

      {rtOpen && (
        <div className="border-t px-3 pt-3 pb-3">
          <div className="mb-4 flex items-start justify-between px-1">
            {REFTRACKER_STEPS.map((step, idx) => (
              <TimelineStep
                key={step.label}
                label={step.label}
                index={idx}
                currentIndex={rtStepIndex}
                total={REFTRACKER_STEPS.length}
              />
            ))}
          </div>

          {refTracker.events.length > 0 && (
            <div className="space-y-1.5">
              {[...refTracker.events]
                .reverse()
                .slice(0, 4)
                .map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <Clock className="text-muted-foreground mt-0.5 size-3 shrink-0" />
                    <span className="text-muted-foreground">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                    <span>{evt.note}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TechOneSection({
  techOne,
  woStepIndex,
}: {
  techOne: NonNullable<IntegrationState['techOne']>;
  woStepIndex: number;
}) {
  const [woOpen, setWoOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setWoOpen(!woOpen)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold">Financial</span>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px]',
              TECHONE_STATUS_STYLES[techOne.status].bg,
              TECHONE_STATUS_STYLES[techOne.status].color,
            )}
          >
            {TECHONE_STATUS_STYLES[techOne.status].label}
          </Badge>
          <span className="text-muted-foreground text-xs">
            Est: ${techOne.totalEstimate.toFixed(2)} | Actual: ${techOne.totalActual.toFixed(2)}
          </span>
        </div>
        {woOpen ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </button>

      {woOpen && (
        <div className="border-t px-3 pt-3 pb-3">
          <div className="mb-3 flex items-start justify-between px-1">
            {TECHONE_STEPS.map((step, idx) => (
              <TimelineStep
                key={step.label}
                label={step.label}
                index={idx}
                currentIndex={woStepIndex}
                total={TECHONE_STEPS.length}
              />
            ))}
          </div>
          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
            <span className="text-muted-foreground">Work Order:</span> {techOne.id}
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrationTimeline({ state }: { state: IntegrationState }) {
  const { refTracker, techOne } = state;

  if (!refTracker && !techOne) return null;

  const rtStepIndex = refTracker ? REFTRACKER_STATUS_ORDER.indexOf(refTracker.status) : -1;
  const woStepIndex = techOne ? TECHONE_STATUS_ORDER.indexOf(techOne.status) : -1;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-widest uppercase">
        Integration Status
      </h3>

      <div className="space-y-3">
        {refTracker && <RefTrackerSection refTracker={refTracker} rtStepIndex={rtStepIndex} />}
        {techOne && <TechOneSection techOne={techOne} woStepIndex={woStepIndex} />}
      </div>
    </div>
  );
}
