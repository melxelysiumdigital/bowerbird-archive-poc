import {
  REFTRACKER_STATUS_STYLES,
  REFTRACKER_STEPS,
  REFTRACKER_STATUS_ORDER,
} from '@bowerbird-poc/shared/constants';
import type {
  DigitisationRequest,
  IntegrationState,
  RefTrackerStatus,
} from '@bowerbird-poc/shared/types';
import { Badge } from '@bowerbird-poc/ui/components/badge';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Input } from '@bowerbird-poc/ui/components/input';
import { cn } from '@bowerbird-poc/ui/lib/utils';
import { Check, ChevronRight, Plus, Clock, Search, Zap, Play } from 'lucide-react';

// ─── Mini stepper for control panel ─────────────────────────

export function MiniStep({
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
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            'flex items-center justify-center rounded-full text-[10px] font-bold transition-all',
            isCurrent && 'bg-primary size-7 text-white shadow',
            isCompleted && 'bg-primary/80 size-5 text-white',
            isPending && 'size-5 bg-gray-200 text-gray-400',
          )}
        >
          {isCompleted && <Check className="size-3" />}
          {isCurrent && index + 1}
        </div>
        <span
          className={cn(
            'max-w-[60px] text-center text-[9px] leading-tight font-medium',
            isCurrent && 'text-primary font-bold',
            isPending && 'text-gray-400',
          )}
        >
          {label}
        </span>
      </div>
      {index < total - 1 && (
        <div
          className={cn(
            'mt-[-12px] h-0.5 flex-grow',
            currentIndex > index ? 'bg-primary' : 'bg-gray-200',
          )}
        />
      )}
    </>
  );
}

// ─── RequestSelector ─────────────────────────────────────────
export function RequestSelector({
  email,
  setEmail,
  isLoadingRequests,
  error,
  requests,
  selectedRequestId,
  onFetch,
  onSelect,
}: {
  email: string;
  setEmail: (v: string) => void;
  isLoadingRequests: boolean;
  error: string | null;
  requests: DigitisationRequest[];
  selectedRequestId: number | undefined;
  onFetch: () => void;
  onSelect: (req: DigitisationRequest) => void;
}) {
  return (
    <div className="bg-card mb-6 rounded-xl border p-6 shadow-sm">
      <h2 className="text-muted-foreground mb-4 text-sm font-bold tracking-widest uppercase">
        Select Digitisation Request
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onFetch();
        }}
        className="mb-4 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Customer email..."
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isLoadingRequests || !email.trim()}>
          {isLoadingRequests ? 'Loading...' : 'Fetch'}
        </Button>
      </form>
      {error && (
        <div className="border-destructive/20 bg-destructive/5 text-destructive mb-4 rounded border px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {requests.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => onSelect(req)}
              className={cn(
                'hover:border-primary/40 rounded-lg border p-4 text-left transition-all',
                selectedRequestId === req.id &&
                  'border-primary bg-primary/5 ring-primary/20 ring-1',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{req.name}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px]',
                    req.status === 'complete' && 'bg-green-100 text-green-700',
                    req.status === 'pending_review' && 'bg-amber-100 text-amber-700',
                    req.status === 'digitising' && 'bg-violet-100 text-violet-700',
                  )}
                >
                  {req.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {req.items.length} item{req.items.length !== 1 && 's'} &middot; {req.requestedAt}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EventLog ────────────────────────────────────────────────
export function EventLog({
  events,
}: {
  events: Array<{ timestamp: string; note: string; operator: string }>;
}) {
  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-wider uppercase">
        Event Log
      </p>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {[...events].reverse().map((evt, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <Clock className="text-muted-foreground mt-0.5 size-3 shrink-0" />
            <div>
              <span className="text-muted-foreground">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
              <span className="mx-1">—</span>
              <span>{evt.note}</span>
              <span className="text-muted-foreground ml-1">({evt.operator})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RefTrackerCard ──────────────────────────────────────────
export function RefTrackerCard({
  rt,
  rtStepIndex,
  onCreate,
  onAdvance,
  onJump,
}: {
  rt: IntegrationState['refTracker'];
  rtStepIndex: number;
  onCreate: () => void;
  onAdvance: () => void;
  onJump: (status: RefTrackerStatus) => void;
}) {
  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">RefTracker</h3>
          {rt && (
            <Badge
              variant="secondary"
              className={cn(
                REFTRACKER_STATUS_STYLES[rt.status].bg,
                REFTRACKER_STATUS_STYLES[rt.status].color,
                'text-xs',
              )}
            >
              {REFTRACKER_STATUS_STYLES[rt.status].label}
            </Badge>
          )}
        </div>
        {rt && (
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {rt.id} &middot; {rt.barcode}
          </p>
        )}
      </div>
      <div className="p-4">
        {!rt ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4 text-sm">No RefTracker job yet</p>
            <Button size="sm" className="gap-1.5" onClick={onCreate}>
              <Plus className="size-3" />
              Create Job
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between px-1">
              {REFTRACKER_STEPS.map((step, idx) => (
                <MiniStep
                  key={step.label}
                  label={step.label}
                  index={idx}
                  currentIndex={rtStepIndex}
                  total={REFTRACKER_STEPS.length}
                />
              ))}
            </div>
            <div className="bg-muted/50 mb-4 rounded-lg p-3">
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Location
              </p>
              <p className="text-sm font-medium">{rt.location}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="gap-1.5"
                onClick={onAdvance}
                disabled={rt.status === 'reshelved'}
              >
                <ChevronRight className="size-3" />
                Advance
              </Button>
              <select
                className="bg-background rounded-md border px-2 py-1 text-xs"
                value=""
                onChange={(e) => {
                  if (e.target.value) onJump(e.target.value as RefTrackerStatus);
                }}
              >
                <option value="">Jump to...</option>
                {REFTRACKER_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {REFTRACKER_STATUS_STYLES[s].label}
                  </option>
                ))}
              </select>
            </div>
            <EventLog events={rt.events} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── CostLineForm ────────────────────────────────────────────
export function CostLineForm({
  costDesc,
  setCostDesc,
  costCategory,
  setCostCategory,
  costAmount,
  setCostAmount,
  onAdd,
}: {
  costDesc: string;
  setCostDesc: (v: string) => void;
  costCategory: string;
  setCostCategory: (v: string) => void;
  costAmount: string;
  setCostAmount: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-wider uppercase">
        Add Cost Line
      </p>
      <div className="flex gap-2">
        <Input
          value={costDesc}
          onChange={(e) => setCostDesc(e.target.value)}
          placeholder="Description"
          className="flex-1 text-xs"
        />
        <select
          className="bg-background rounded-md border px-2 text-xs"
          value={costCategory}
          onChange={(e) => setCostCategory(e.target.value)}
        >
          <option>Labour</option>
          <option>Service</option>
          <option>Infrastructure</option>
          <option>Materials</option>
        </select>
        <Input
          value={costAmount}
          onChange={(e) => setCostAmount(e.target.value)}
          placeholder="$"
          type="number"
          className="w-20 text-xs"
        />
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── TechOneCostSummary ──────────────────────────────────────
export function TechOneCostSummary({ wo }: { wo: NonNullable<IntegrationState['techOne']> }) {
  return (
    <div className="bg-muted/50 mb-4 rounded-lg p-3">
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Estimated
          </p>
          <p className="font-bold">${wo.totalEstimate.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Actual
          </p>
          <p className="font-bold">${wo.totalActual.toFixed(2)}</p>
        </div>
      </div>
      {wo.approvedBy && (
        <p className="text-muted-foreground mt-2 text-xs">
          Approved by: <span className="font-medium">{wo.approvedBy}</span>
        </p>
      )}
    </div>
  );
}

// ─── TechOneCostBreakdown ────────────────────────────────────
export function TechOneCostBreakdown({
  costLines,
}: {
  costLines: NonNullable<IntegrationState['techOne']>['costLines'];
}) {
  return (
    <div className="mb-4">
      <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-wider uppercase">
        Cost Breakdown
      </p>
      <div className="space-y-1">
        {costLines.map((line, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span>
              {line.description} <span className="text-muted-foreground">({line.category})</span>
            </span>
            <span className="font-mono font-medium">${line.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ActionLog ───────────────────────────────────────────────
export function ActionLog({ log }: { log: string[] }) {
  if (log.length === 0) return null;
  return (
    <div className="bg-card mt-6 rounded-xl border p-4 shadow-sm">
      <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-wider uppercase">
        Action Log
      </p>
      <div className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
        {log.map((msg, idx) => (
          <p key={idx} className="text-muted-foreground">
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── QuickDemoBar ────────────────────────────────────────────
export function QuickDemoBar({
  isRunning,
  onRun,
  onStop,
}: {
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
}) {
  return (
    <div className="bg-card mb-6 flex items-center justify-between rounded-xl border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Zap className="size-5 text-amber-500" />
        <div>
          <p className="text-sm font-bold">Quick Demo Flow</p>
          <p className="text-muted-foreground text-xs">
            Auto-advance both systems through all steps
          </p>
        </div>
      </div>
      {isRunning ? (
        <Button variant="destructive" size="sm" onClick={onStop}>
          Stop
        </Button>
      ) : (
        <Button size="sm" className="gap-1.5" onClick={onRun}>
          <Play className="size-3" />
          Run Full Sequence
        </Button>
      )}
    </div>
  );
}
