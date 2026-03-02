import { REFTRACKER_STATUS_ORDER, TECHONE_STATUS_ORDER } from '@bowerbird-poc/shared/constants';
import type {
  DigitisationRequest,
  IntegrationState,
  RefTrackerStatus,
  TechOneStatus,
} from '@bowerbird-poc/shared/types';
import { Button } from '@bowerbird-poc/ui/components/button';
import { cn } from '@bowerbird-poc/ui/lib/utils';
import { RefreshCw } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

import { RefTrackerCard, ActionLog, QuickDemoBar } from './staff-components';
import { TechOneCard } from './techone-card';

import type { useMockIntegrations } from '@/hooks/use-mock-integrations';

// ─── Shared callback args type ───────────────────────────────
export interface CallbackDeps {
  selectedRequest: DigitisationRequest;
  integrationApi: ReturnType<typeof useMockIntegrations>;
  integration: IntegrationState | null;
  log: (msg: string) => void;
  refreshIntegration: () => Promise<void>;
}

// ─── useRefTrackerCallbacks ─────────────────────────────────
export function useRefTrackerCallbacks({
  selectedRequest,
  integrationApi,
  integration,
  log,
  refreshIntegration,
}: CallbackDeps) {
  const handleCreateRT = useCallback(async () => {
    const item = selectedRequest.items[0];
    try {
      await integrationApi.createRefTrackerJob(
        selectedRequest.id,
        `BB-${selectedRequest.id}`,
        item?.title || 'Archive Item',
      );
      log(`Created RefTracker job for ${selectedRequest.name}`);
      await refreshIntegration();
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  }, [selectedRequest, integrationApi, refreshIntegration, log]);

  const handleAdvanceRT = useCallback(async () => {
    if (!integration?.refTracker) return;
    try {
      const job = await integrationApi.advanceRefTracker(integration.refTracker.id);
      log(`RefTracker → ${job.status}`);
      await refreshIntegration();
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  }, [integration, integrationApi, refreshIntegration, log]);

  const handleJumpRT = useCallback(
    async (status: RefTrackerStatus) => {
      if (!integration?.refTracker) return;
      try {
        await integrationApi.setRefTrackerStatus(integration.refTracker.id, status);
        log(`RefTracker jumped to ${status}`);
        await refreshIntegration();
      } catch (err) {
        log(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
      }
    },
    [integration, integrationApi, refreshIntegration, log],
  );

  return { handleCreateRT, handleAdvanceRT, handleJumpRT };
}

// ─── useTechOneCallbacks ────────────────────────────────────
export function useTechOneCallbacks({
  selectedRequest,
  integrationApi,
  integration,
  log,
  refreshIntegration,
}: CallbackDeps) {
  const [costDesc, setCostDesc] = useState('');
  const [costCategory, setCostCategory] = useState('Labour');
  const [costAmount, setCostAmount] = useState('');

  const handleCreateWO = useCallback(async () => {
    const estimate = selectedRequest.quoteAmount
      ? parseFloat(selectedRequest.quoteAmount.replace('$', ''))
      : 150;
    try {
      await integrationApi.createTechOneWorkOrder(selectedRequest.id, estimate);
      log(`Created TechOne work order for ${selectedRequest.name}`);
      await refreshIntegration();
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  }, [selectedRequest, integrationApi, refreshIntegration, log]);

  const handleAdvanceWO = useCallback(async () => {
    if (!integration?.techOne) return;
    try {
      const wo = await integrationApi.advanceTechOne(integration.techOne.id);
      log(`TechOne → ${wo.status}`);
      await refreshIntegration();
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  }, [integration, integrationApi, refreshIntegration, log]);

  const handleJumpWO = useCallback(
    async (status: TechOneStatus) => {
      if (!integration?.techOne) return;
      try {
        await integrationApi.setTechOneStatus(integration.techOne.id, status);
        log(`TechOne jumped to ${status}`);
        await refreshIntegration();
      } catch (err) {
        log(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
      }
    },
    [integration, integrationApi, refreshIntegration, log],
  );

  const handleAddCostLine = useCallback(async () => {
    if (!integration?.techOne || !costDesc.trim() || !costAmount) return;
    try {
      await integrationApi.addCostLine(integration.techOne.id, {
        description: costDesc,
        category: costCategory,
        amount: Number(costAmount),
      });
      log(`Added cost line: ${costDesc} ($${costAmount})`);
      setCostDesc('');
      setCostAmount('');
      await refreshIntegration();
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  }, [integration, costDesc, costCategory, costAmount, integrationApi, refreshIntegration, log]);

  return {
    handleCreateWO,
    handleAdvanceWO,
    handleJumpWO,
    handleAddCostLine,
    costDesc,
    setCostDesc,
    costCategory,
    setCostCategory,
    costAmount,
    setCostAmount,
  };
}

// ─── runDemoSequence ─────────────────────────────────────────
export async function runDemoSequence(
  req: DigitisationRequest,
  integration: IntegrationState | null,
  api: ReturnType<typeof useMockIntegrations>,
  cancelledRef: React.RefObject<boolean>,
  log: (msg: string) => void,
  setIntegration: (s: IntegrationState) => void,
) {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const item = req.items[0];
  const barcode = `BB-${req.id}`;
  const estimate = req.quoteAmount ? parseFloat(req.quoteAmount.replace('$', '')) : 150;
  if (!integration?.refTracker) {
    await api.createRefTrackerJob(req.id, barcode, item?.title || 'Archive Item');
    log('Created RefTracker job');
    setIntegration(await api.getIntegrationState(req.id));
    await delay(1000);
  }
  if (cancelledRef.current) return;
  if (!integration?.techOne) {
    await api.createTechOneWorkOrder(req.id, estimate);
    log('Created TechOne work order');
    setIntegration(await api.getIntegrationState(req.id));
    await delay(1000);
  }
  let state = await api.getIntegrationState(req.id);
  if (state.refTracker) {
    const rtId = state.refTracker.id;
    for (
      let i = REFTRACKER_STATUS_ORDER.indexOf(state.refTracker.status);
      i < REFTRACKER_STATUS_ORDER.length - 1;
      i++
    ) {
      if (cancelledRef.current) return;
      const job = await api.advanceRefTracker(rtId);
      log(`RefTracker → ${job.status}`);
      state = await api.getIntegrationState(req.id);
      setIntegration(state);
      await delay(800);
    }
  }
  if (state.techOne) {
    const woId = state.techOne.id;
    for (
      let i = TECHONE_STATUS_ORDER.indexOf(state.techOne.status);
      i < TECHONE_STATUS_ORDER.length - 1;
      i++
    ) {
      if (cancelledRef.current) return;
      const wo = await api.advanceTechOne(woId);
      log(`TechOne → ${wo.status}`);
      state = await api.getIntegrationState(req.id);
      setIntegration(state);
      await delay(800);
    }
  }
  log('Full sequence complete!');
}

// ─── useDemoSequence ────────────────────────────────────────
export function useDemoSequence({
  selectedRequest,
  integrationApi,
  integration,
  log,
  refreshIntegration,
  setIntegration,
}: CallbackDeps & { setIntegration: (s: IntegrationState) => void }) {
  const [isRunningSequence, setIsRunningSequence] = useState(false);
  const sequenceRef = useRef(false);

  const handleRunSequence = useCallback(async () => {
    if (isRunningSequence) return;
    setIsRunningSequence(true);
    sequenceRef.current = false;
    log('Starting full demo sequence...');
    try {
      await runDemoSequence(
        selectedRequest,
        integration,
        integrationApi,
        sequenceRef,
        log,
        setIntegration,
      );
    } catch (err) {
      log(`Sequence error: ${err instanceof Error ? err.message : 'Failed'}`);
    } finally {
      setIsRunningSequence(false);
      sequenceRef.current = false;
      await refreshIntegration();
    }
  }, [
    selectedRequest,
    isRunningSequence,
    integration,
    integrationApi,
    refreshIntegration,
    log,
    setIntegration,
  ]);

  const stopSequence = useCallback(() => {
    sequenceRef.current = true;
    setIsRunningSequence(false);
    log('Sequence stopped');
  }, [log]);

  return { handleRunSequence, stopSequence, isRunningSequence };
}

// ─── IntegrationPanel ────────────────────────────────────────
export function IntegrationPanel({
  selectedRequest,
  integrationApi,
}: {
  selectedRequest: DigitisationRequest;
  integrationApi: ReturnType<typeof useMockIntegrations>;
}) {
  const [integration, setIntegration] = useState<IntegrationState | null>(null);
  const [isLoadingIntegration, setIsLoadingIntegration] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const log = useCallback((msg: string) => {
    setActionLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  const refreshIntegration = useCallback(async () => {
    setIsLoadingIntegration(true);
    try {
      setIntegration(await integrationApi.getIntegrationState(selectedRequest.id));
    } catch {
      // Integration state not available yet
    } finally {
      setIsLoadingIntegration(false);
    }
  }, [selectedRequest.id, integrationApi]);

  const deps = { selectedRequest, integrationApi, integration, log, refreshIntegration };
  const rt_cb = useRefTrackerCallbacks(deps);
  const wo_cb = useTechOneCallbacks(deps);
  const demo = useDemoSequence({ ...deps, setIntegration });

  const rt = integration?.refTracker ?? null;
  const wo = integration?.techOne ?? null;
  const rtStepIndex = rt ? REFTRACKER_STATUS_ORDER.indexOf(rt.status) : -1;
  const woStepIndex = wo ? TECHONE_STATUS_ORDER.indexOf(wo.status) : -1;

  return (
    <>
      <div className="mb-8 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={refreshIntegration}
          disabled={isLoadingIntegration}
        >
          <RefreshCw className={cn('size-4', isLoadingIntegration && 'animate-spin')} />
          Refresh
        </Button>
      </div>
      <QuickDemoBar
        isRunning={demo.isRunningSequence}
        onRun={demo.handleRunSequence}
        onStop={demo.stopSequence}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RefTrackerCard
          rt={rt}
          rtStepIndex={rtStepIndex}
          onCreate={rt_cb.handleCreateRT}
          onAdvance={rt_cb.handleAdvanceRT}
          onJump={rt_cb.handleJumpRT}
        />
        <TechOneCard
          wo={wo}
          woStepIndex={woStepIndex}
          onCreate={wo_cb.handleCreateWO}
          onAdvance={wo_cb.handleAdvanceWO}
          onJump={wo_cb.handleJumpWO}
          costDesc={wo_cb.costDesc}
          setCostDesc={wo_cb.setCostDesc}
          costCategory={wo_cb.costCategory}
          setCostCategory={wo_cb.setCostCategory}
          costAmount={wo_cb.costAmount}
          setCostAmount={wo_cb.setCostAmount}
          onAddCostLine={wo_cb.handleAddCostLine}
        />
      </div>
      <ActionLog log={actionLog} />
    </>
  );
}
