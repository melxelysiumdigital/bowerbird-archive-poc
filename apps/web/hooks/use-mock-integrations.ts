'use client';

import type {
  RefTrackerJob,
  RefTrackerStatus,
  TechOneWorkOrder,
  TechOneStatus,
  TechOneCostLine,
  IntegrationState,
} from '@bowerbird-poc/shared/types';
import { useCallback } from 'react';

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useMockIntegrations() {
  const createRefTrackerJob = useCallback(
    (draftOrderId: number, barcode: string, itemTitle: string) =>
      apiFetch<RefTrackerJob>('/api/mock/reftracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftOrderId, barcode, itemTitle }),
      }),
    [],
  );

  const advanceRefTracker = useCallback(
    (jobId: string, note?: string) =>
      apiFetch<RefTrackerJob>(`/api/mock/reftracker/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance', note }),
      }),
    [],
  );

  const setRefTrackerStatus = useCallback(
    (jobId: string, status: RefTrackerStatus, note?: string) =>
      apiFetch<RefTrackerJob>(`/api/mock/reftracker/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', status, note }),
      }),
    [],
  );

  const createTechOneWorkOrder = useCallback(
    (draftOrderId: number, estimate: number) =>
      apiFetch<TechOneWorkOrder>('/api/mock/techone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftOrderId, estimate }),
      }),
    [],
  );

  const advanceTechOne = useCallback(
    (workOrderId: string) =>
      apiFetch<TechOneWorkOrder>(`/api/mock/techone/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      }),
    [],
  );

  const setTechOneStatus = useCallback(
    (workOrderId: string, status: TechOneStatus) =>
      apiFetch<TechOneWorkOrder>(`/api/mock/techone/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', status }),
      }),
    [],
  );

  const addCostLine = useCallback(
    (workOrderId: string, costLine: TechOneCostLine) =>
      apiFetch<TechOneWorkOrder>(`/api/mock/techone/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_cost_line', costLine }),
      }),
    [],
  );

  const getIntegrationState = useCallback(
    (draftOrderId: number) =>
      apiFetch<IntegrationState>(`/api/mock/integrations?draftOrderId=${draftOrderId}`),
    [],
  );

  const getAllIntegrations = useCallback(
    () => apiFetch<IntegrationState[]>('/api/mock/integrations'),
    [],
  );

  const resetAll = useCallback(
    () => apiFetch<{ ok: boolean }>('/api/mock/reset', { method: 'POST' }),
    [],
  );

  return {
    createRefTrackerJob,
    advanceRefTracker,
    setRefTrackerStatus,
    createTechOneWorkOrder,
    advanceTechOne,
    setTechOneStatus,
    addCostLine,
    getIntegrationState,
    getAllIntegrations,
    resetAll,
  };
}
