import {
  TECHONE_STATUS_STYLES,
  TECHONE_STEPS,
  TECHONE_STATUS_ORDER,
} from '@bowerbird-poc/shared/constants';
import type { IntegrationState, TechOneStatus } from '@bowerbird-poc/shared/types';
import { Badge } from '@bowerbird-poc/ui/components/badge';
import { Button } from '@bowerbird-poc/ui/components/button';
import { cn } from '@bowerbird-poc/ui/lib/utils';
import { ChevronRight, Plus } from 'lucide-react';

import {
  CostLineForm,
  MiniStep,
  TechOneCostBreakdown,
  TechOneCostSummary,
} from './staff-components';

// ─── TechOneControls ─────────────────────────────────────────
function TechOneControls({
  wo,
  onAdvance,
  onJump,
  costDesc,
  setCostDesc,
  costCategory,
  setCostCategory,
  costAmount,
  setCostAmount,
  onAddCostLine,
}: {
  wo: NonNullable<IntegrationState['techOne']>;
  onAdvance: () => void;
  onJump: (status: TechOneStatus) => void;
  costDesc: string;
  setCostDesc: (v: string) => void;
  costCategory: string;
  setCostCategory: (v: string) => void;
  costAmount: string;
  setCostAmount: (v: string) => void;
  onAddCostLine: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-1.5" onClick={onAdvance} disabled={wo.status === 'closed'}>
          <ChevronRight className="size-3" />
          Advance
        </Button>
        <select
          className="bg-background rounded-md border px-2 py-1 text-xs"
          value=""
          onChange={(e) => {
            if (e.target.value) onJump(e.target.value as TechOneStatus);
          }}
        >
          <option value="">Jump to...</option>
          {TECHONE_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {TECHONE_STATUS_STYLES[s].label}
            </option>
          ))}
        </select>
      </div>
      <CostLineForm
        costDesc={costDesc}
        setCostDesc={setCostDesc}
        costCategory={costCategory}
        setCostCategory={setCostCategory}
        costAmount={costAmount}
        setCostAmount={setCostAmount}
        onAdd={onAddCostLine}
      />
    </>
  );
}

// ─── TechOneCard ─────────────────────────────────────────────
export function TechOneCard({
  wo,
  woStepIndex,
  onCreate,
  onAdvance,
  onJump,
  costDesc,
  setCostDesc,
  costCategory,
  setCostCategory,
  costAmount,
  setCostAmount,
  onAddCostLine,
}: {
  wo: IntegrationState['techOne'];
  woStepIndex: number;
  onCreate: () => void;
  onAdvance: () => void;
  onJump: (status: TechOneStatus) => void;
  costDesc: string;
  setCostDesc: (v: string) => void;
  costCategory: string;
  setCostCategory: (v: string) => void;
  costAmount: string;
  setCostAmount: (v: string) => void;
  onAddCostLine: () => void;
}) {
  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">TechOne</h3>
          {wo && (
            <Badge
              variant="secondary"
              className={cn(
                TECHONE_STATUS_STYLES[wo.status].bg,
                TECHONE_STATUS_STYLES[wo.status].color,
                'text-xs',
              )}
            >
              {TECHONE_STATUS_STYLES[wo.status].label}
            </Badge>
          )}
        </div>
        {wo && (
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {wo.id} &middot; {wo.costCentre}
          </p>
        )}
      </div>
      <div className="p-4">
        {!wo ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4 text-sm">No TechOne work order yet</p>
            <Button size="sm" className="gap-1.5" onClick={onCreate}>
              <Plus className="size-3" />
              Create Work Order
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between px-1">
              {TECHONE_STEPS.map((step, idx) => (
                <MiniStep
                  key={step.label}
                  label={step.label}
                  index={idx}
                  currentIndex={woStepIndex}
                  total={TECHONE_STEPS.length}
                />
              ))}
            </div>
            <TechOneCostSummary wo={wo} />
            <TechOneCostBreakdown costLines={wo.costLines} />
            <TechOneControls
              wo={wo}
              onAdvance={onAdvance}
              onJump={onJump}
              costDesc={costDesc}
              setCostDesc={setCostDesc}
              costCategory={costCategory}
              setCostCategory={setCostCategory}
              costAmount={costAmount}
              setCostAmount={setCostAmount}
              onAddCostLine={onAddCostLine}
            />
          </>
        )}
      </div>
    </div>
  );
}
