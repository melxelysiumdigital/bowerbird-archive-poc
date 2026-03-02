'use client';

import type {
  DigitisationRequest,
  CancelledRequestData,
  IntegrationState,
} from '@bowerbird-poc/shared/types';
import { cn } from '@bowerbird-poc/ui/lib/utils';
import { useState } from 'react';

import {
  CancelledRequestView,
  RequestHeader,
  RequestProgressStepper,
  RequestedItemsList,
  ActionsSidebar,
} from './digitisation-request-card-parts';
import { IntegrationTimeline } from './integration-timeline';

interface DigitisationRequestCardProps {
  request: DigitisationRequest;
  isExpanded: boolean;
  onToggle: () => void;
  onCancel?: (id: number) => Promise<CancelledRequestData>;
  onRecreate?: (data: CancelledRequestData) => Promise<void>;
  onRefresh?: () => void;
  integrationState?: IntegrationState | null;
}

export function DigitisationRequestCard({
  request,
  isExpanded,
  onToggle,
  onCancel,
  onRecreate,
  onRefresh,
  integrationState,
}: DigitisationRequestCardProps) {
  const [cancelState, setCancelState] = useState<
    'idle' | 'confirming' | 'cancelling' | 'cancelled'
  >('idle');
  const [cancelledData, setCancelledData] = useState<CancelledRequestData | null>(null);
  const [isRecreating, setIsRecreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!onCancel) return;
    setCancelState('cancelling');
    setError(null);
    try {
      const data = await onCancel(request.id);
      setCancelledData(data);
      setCancelState('cancelled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
      setCancelState('idle');
    }
  };

  const handleRecreate = async () => {
    if (!onRecreate || !cancelledData) return;
    setIsRecreating(true);
    setError(null);
    try {
      await onRecreate(cancelledData);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recreate');
      setIsRecreating(false);
    }
  };

  if (cancelState === 'cancelled' && cancelledData) {
    return (
      <CancelledRequestView
        request={request}
        cancelledData={cancelledData}
        error={error}
        isRecreating={isRecreating}
        onRecreate={handleRecreate}
      />
    );
  }

  return (
    <div
      className={cn(
        'bg-card overflow-hidden rounded-xl border shadow-sm transition-all',
        !isExpanded && 'hover:border-primary/40 cursor-pointer',
      )}
      onClick={() => !isExpanded && onToggle()}
    >
      <RequestHeader request={request} isExpanded={isExpanded} onToggle={onToggle} />

      {isExpanded && (
        <div className="p-6">
          <RequestProgressStepper status={request.status} currentStep={request.currentStep} />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <RequestedItemsList items={request.items} notes={request.notes} />

            <ActionsSidebar
              request={request}
              cancelState={cancelState}
              error={error}
              onCancel={onCancel}
              onCancelStateChange={setCancelState}
              onConfirmCancel={handleCancel}
            />
          </div>

          {integrationState && (integrationState.refTracker || integrationState.techOne) && (
            <IntegrationTimeline state={integrationState} />
          )}
        </div>
      )}
    </div>
  );
}
