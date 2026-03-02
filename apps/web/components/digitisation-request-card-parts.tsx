import { DIGITISATION_STATUS_STYLES, DIGITISATION_STEPS } from '@bowerbird-poc/shared/constants';
import type { DigitisationRequest, CancelledRequestData } from '@bowerbird-poc/shared/types';
import { Badge } from '@bowerbird-poc/ui/components/badge';
import { Button } from '@bowerbird-poc/ui/components/button';
import { cn } from '@bowerbird-poc/ui/lib/utils';
import {
  Check,
  ChevronDown,
  ChevronUp,
  XCircle,
  Hourglass,
  CircleCheckBig,
  ScanLine,
  Download,
  RotateCcw,
  Image,
  FileSearch,
  FileText,
  CreditCard,
} from 'lucide-react';

export const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CircleCheckBig,
  FileSearch,
  FileText,
  CreditCard,
  ScanLine,
  Download,
};

export function DigitisationStep({
  step,
  label,
  currentStep,
  iconName,
  totalSteps,
}: {
  step: number;
  label: string;
  currentStep: number;
  iconName: string;
  totalSteps: number;
}) {
  const isCompleted = currentStep > step;
  const isCurrent = currentStep === step;
  const isPending = currentStep < step;
  const Icon = STEP_ICONS[iconName];

  return (
    <>
      <div className="flex flex-1 flex-col items-center gap-2">
        <div
          className={cn(
            'flex items-center justify-center rounded-full transition-all',
            isCurrent &&
              'border-primary/20 bg-primary shadow-primary/30 -mt-2 size-10 border-4 text-white shadow-lg',
            isCompleted && 'bg-primary size-6 text-white',
            isPending && 'size-6 bg-gray-200 text-gray-400',
          )}
        >
          {isCompleted && <Check className="size-3" />}
          {isCurrent && Icon && <Icon className="size-4" />}
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
      {step < totalSteps && (
        <div className={cn('h-0.5 flex-grow', currentStep > step ? 'bg-primary' : 'bg-gray-200')} />
      )}
    </>
  );
}

export function CancelledRequestView({
  request,
  cancelledData,
  error,
  isRecreating,
  onRecreate,
}: {
  request: DigitisationRequest;
  cancelledData: CancelledRequestData;
  error: string | null;
  isRecreating: boolean;
  onRecreate: () => void;
}) {
  return (
    <div className="border-destructive/20 bg-card overflow-hidden rounded-xl border p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="bg-destructive/10 flex size-10 shrink-0 items-center justify-center rounded-full">
          <XCircle className="text-destructive size-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{request.name} — Cancelled</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            This digitisation request has been cancelled.
          </p>

          {cancelledData.items.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-2 text-xs font-bold tracking-wider uppercase">
                Items from this request
              </p>
              <ul className="space-y-1">
                {cancelledData.items.map((item, idx) => (
                  <li key={idx} className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Image className="text-muted-foreground/40 size-3" />
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="border-destructive/20 bg-destructive/5 text-destructive mt-3 rounded border px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <Button size="sm" disabled={isRecreating} onClick={onRecreate} className="gap-1.5">
              {isRecreating ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Recreating...
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  Recreate Request
                </>
              )}
            </Button>
            <p className="text-muted-foreground text-xs">
              Changed your mind? Recreate this request with a note to our team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RequestProgressStepper({
  status,
  currentStep,
}: {
  status: DigitisationRequest['status'];
  currentStep: number;
}) {
  if (status !== 'cancelled') {
    return (
      <div className="mb-10">
        <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-widest uppercase">
          Request Progress
        </h3>
        <div className="flex items-center justify-between px-2">
          {DIGITISATION_STEPS.map((step, idx) => (
            <DigitisationStep
              key={idx}
              step={idx + 1}
              label={step.label}
              iconName={step.icon}
              currentStep={currentStep}
              totalSteps={DIGITISATION_STEPS.length}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-destructive/20 bg-destructive/5 mb-10 flex items-center gap-3 rounded-lg border p-4">
      <XCircle className="text-destructive size-6" />
      <div>
        <p className="text-destructive text-sm font-bold">Request Cancelled</p>
        <p className="text-destructive/70 mt-0.5 text-xs">
          This digitisation request has been cancelled. If you believe this is an error, please
          contact us.
        </p>
      </div>
    </div>
  );
}

export function RequestedItemsList({
  items,
  notes,
}: {
  items: DigitisationRequest['items'];
  notes?: string;
}) {
  return (
    <div className="md:col-span-2">
      <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-widest uppercase">
        {items.length === 1 ? 'Requested Item' : `Requested Items (${items.length})`}
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 rounded-lg border p-3">
            {item.image && (
              <div
                className="bg-muted size-20 shrink-0 rounded bg-cover bg-center"
                style={{ backgroundImage: `url("${item.image}")` }}
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-bold">{item.title}</p>
              {item.type && <p className="text-accent-gold mt-1 text-xs font-bold">{item.type}</p>}
            </div>
          </div>
        ))}
      </div>
      {notes && (
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          <span className="font-semibold">Notes:</span> {notes}
        </p>
      )}
    </div>
  );
}

export function StatusContent({ request }: { request: DigitisationRequest }) {
  if (request.status === 'pending_review') {
    return (
      <div>
        <h4 className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
          Status
        </h4>
        <div className="flex items-start gap-2">
          <Hourglass className="mt-0.5 size-4 text-amber-500" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Our team is reviewing your request. We&apos;ll send you a quote within 2-3 business
            days.
          </p>
        </div>
      </div>
    );
  }

  if (request.status === 'quote_ready') {
    return (
      <div>
        <h4 className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
          Quote
        </h4>
        {request.quoteAmount && (
          <p className="text-primary mb-3 text-2xl font-bold">{request.quoteAmount}</p>
        )}
        {request.invoiceUrl && (
          <Button asChild className="w-full">
            <a href={request.invoiceUrl} target="_blank" rel="noopener noreferrer">
              Pay Invoice
            </a>
          </Button>
        )}
      </div>
    );
  }

  if (request.status === 'payment_received') {
    return (
      <div>
        <h4 className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
          Status
        </h4>
        <div className="flex items-start gap-2">
          <CircleCheckBig className="mt-0.5 size-4 text-green-500" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Payment received. Your item is being prepared for digitisation.
          </p>
        </div>
      </div>
    );
  }

  if (request.status === 'digitising') {
    return (
      <div>
        <h4 className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
          Status
        </h4>
        <div className="flex items-start gap-2">
          <ScanLine className="mt-0.5 size-4 text-emerald-500" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your item is currently being digitised. We&apos;ll notify you when it&apos;s ready.
          </p>
        </div>
      </div>
    );
  }

  if (request.status === 'complete') {
    return (
      <div>
        <h4 className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
          Download
        </h4>
        <Button className="w-full gap-1.5" variant="default">
          <Download className="size-4" />
          Download Item
        </Button>
      </div>
    );
  }

  return null;
}

export function CancelFlow({
  cancelState,
  error,
  onCancelStateChange,
  onConfirmCancel,
}: {
  cancelState: 'idle' | 'confirming' | 'cancelling' | 'cancelled';
  error: string | null;
  onCancelStateChange: (state: 'idle' | 'confirming' | 'cancelling' | 'cancelled') => void;
  onConfirmCancel: () => void;
}) {
  return (
    <>
      {cancelState === 'idle' && (
        <div className="border-t pt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancelStateChange('confirming');
            }}
            className="text-destructive hover:text-destructive/80 flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors"
          >
            <XCircle className="size-4" />
            Cancel Request
          </button>
        </div>
      )}

      {cancelState === 'confirming' && (
        <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
          <p className="text-destructive mb-1 text-sm font-bold">Cancel this request?</p>
          <p className="text-destructive/70 mb-4 text-xs">
            This will cancel your digitisation request. You can recreate it later if you change your
            mind.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onCancelStateChange('idle');
              }}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmCancel();
              }}
            >
              Cancel Request
            </Button>
          </div>
        </div>
      )}

      {cancelState === 'cancelling' && (
        <div className="flex items-center justify-center gap-2 p-4">
          <span className="border-destructive inline-block size-4 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-destructive text-sm font-medium">Cancelling...</p>
        </div>
      )}

      {error && cancelState === 'idle' && (
        <div className="border-destructive/20 bg-destructive/5 text-destructive rounded border px-3 py-2 text-xs">
          {error}
        </div>
      )}
    </>
  );
}

export function ActionsSidebar({
  request,
  cancelState,
  error,
  onCancel,
  onCancelStateChange,
  onConfirmCancel,
}: {
  request: DigitisationRequest;
  cancelState: 'idle' | 'confirming' | 'cancelling' | 'cancelled';
  error: string | null;
  onCancel?: (id: number) => Promise<CancelledRequestData>;
  onCancelStateChange: (state: 'idle' | 'confirming' | 'cancelling' | 'cancelled') => void;
  onConfirmCancel: () => void;
}) {
  return (
    <div className="bg-muted/30 space-y-4 rounded-xl p-4">
      <StatusContent request={request} />

      {(request.status === 'pending_review' || request.status === 'quote_ready') && onCancel && (
        <CancelFlow
          cancelState={cancelState}
          error={error}
          onCancelStateChange={onCancelStateChange}
          onConfirmCancel={onConfirmCancel}
        />
      )}
    </div>
  );
}

export function RequestHeader({
  request,
  isExpanded,
  onToggle,
}: {
  request: DigitisationRequest;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusStyle = DIGITISATION_STATUS_STYLES[request.status];

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 p-6',
        isExpanded && 'bg-muted/30 border-b',
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">{request.name}</span>
          <Badge
            variant="secondary"
            className={cn(statusStyle.bg, statusStyle.color, 'tracking-wider uppercase')}
          >
            {statusStyle.label}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Requested on {request.requestedAt} &middot;{' '}
          {request.items.length === 1 ? request.items[0].title : `${request.items.length} items`}
          {request.quoteAmount && (
            <>
              {' '}
              &middot; <span className="text-foreground font-semibold">{request.quoteAmount}</span>
            </>
          )}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="text-primary flex items-center gap-1 text-sm font-bold"
      >
        {isExpanded ? 'Collapse' : 'Expand'}
        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
    </div>
  );
}
