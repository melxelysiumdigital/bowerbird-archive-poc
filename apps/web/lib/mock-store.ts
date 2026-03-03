import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

import { REFTRACKER_STATUS_ORDER, TECHONE_STATUS_ORDER } from '@bowerbird-poc/shared/constants';
import type {
  RefTrackerJob,
  RefTrackerStatus,
  TechOneWorkOrder,
  TechOneStatus,
  TechOneCostLine,
  IntegrationState,
} from '@bowerbird-poc/shared/types';

import {
  tagForDraftOrder,
  updateNoteForDraftOrder,
  updateDraftOrderPrice,
} from './shopify-writeback';

// ─── Store shape ────────────────────────────────────────────

interface StoreData {
  refTrackerJobs: Record<string, RefTrackerJob>;
  techOneWorkOrders: Record<string, TechOneWorkOrder>;
}

const DATA_DIR = join(process.cwd(), 'data');
const STORE_PATH = join(DATA_DIR, 'mock-integrations.json');
const SEED_PATH = join(DATA_DIR, 'mock-integrations.seed.json');

// ─── Counters for ID generation ─────────────────────────────

let rtCounter = 0;
let woCounter = 0;

// ─── Location map for RefTracker ────────────────────────────

const LOCATION_MAP: Record<RefTrackerStatus, string> = {
  pending: 'Repository Storage',
  retrieving: 'Repository Storage',
  in_transit: 'In Transit to Lab',
  at_lab: 'Digitisation Lab',
  scanning: 'Digitisation Lab — Scanner Bay',
  qc: 'Digitisation Lab — QC Station',
  returning: 'In Transit to Repository',
  reshelved: 'Repository Storage',
};

// ─── Operator names for events ──────────────────────────────

const OPERATORS = ['J. Mitchell', 'S. Nguyen', 'R. Patel', 'A. Thompson', 'K. Williams'];

function randomOperator(): string {
  return OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
}

// ─── Write-back helpers ────────────────────────────────────

function buildCostNote(wo: TechOneWorkOrder): string {
  const lines = wo.costLines.map(
    (l) => `  ${l.description} (${l.category}): $${l.amount.toFixed(2)}`,
  );
  return [
    `[TechOne ${wo.id}] Cost breakdown:`,
    ...lines,
    `  Total estimate: $${wo.totalEstimate.toFixed(2)}`,
    `  Total actual: $${wo.totalActual.toFixed(2)}`,
  ].join('\n');
}

// ─── Store singleton ────────────────────────────────────────

let store: StoreData | null = null;

function loadStore(): StoreData {
  // Always read from disk — Next.js may use separate workers per route
  if (existsSync(STORE_PATH)) {
    try {
      const raw = readFileSync(STORE_PATH, 'utf-8');
      store = JSON.parse(raw) as StoreData;
    } catch {
      store = emptyStore();
    }
  } else if (existsSync(SEED_PATH)) {
    store = emptyStore();
  } else {
    store = emptyStore();
  }

  // Restore counters from existing data
  for (const job of Object.values(store.refTrackerJobs)) {
    const num = parseInt(job.id.split('-').pop() || '0', 10);
    if (num > rtCounter) rtCounter = num;
  }
  for (const wo of Object.values(store.techOneWorkOrders)) {
    const num = parseInt(wo.id.split('-').pop() || '0', 10);
    if (num > woCounter) woCounter = num;
  }

  return store;
}

function emptyStore(): StoreData {
  return { refTrackerJobs: {}, techOneWorkOrders: {} };
}

function persist(): void {
  if (!store) return;
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// ─── Public API ─────────────────────────────────────────────

export function getStore(): StoreData {
  return loadStore();
}

export function createRefTrackerJob(
  draftOrderId: number,
  barcode: string,
  itemTitle: string,
): RefTrackerJob {
  const s = loadStore();
  rtCounter++;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const id = `RT-${today}-${String(rtCounter).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const job: RefTrackerJob = {
    id,
    draftOrderId,
    status: 'pending',
    barcode,
    itemTitle,
    location: LOCATION_MAP.pending,
    events: [
      {
        timestamp: now,
        note: 'Job created — item retrieval requested',
        operator: randomOperator(),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  s.refTrackerJobs[id] = job;
  persist();
  return job;
}

export function advanceRefTrackerJob(jobId: string, note?: string): RefTrackerJob {
  const s = loadStore();
  const job = s.refTrackerJobs[jobId];
  if (!job) throw new Error(`RefTracker job ${jobId} not found`);

  const idx = REFTRACKER_STATUS_ORDER.indexOf(job.status);
  if (idx >= REFTRACKER_STATUS_ORDER.length - 1) {
    throw new Error(`Job ${jobId} is already at final status: ${job.status}`);
  }

  const nextStatus = REFTRACKER_STATUS_ORDER[idx + 1];
  const now = new Date().toISOString();

  job.status = nextStatus;
  job.location = LOCATION_MAP[nextStatus];
  job.updatedAt = now;
  job.events.push({
    timestamp: now,
    note: note || `Status advanced to ${nextStatus}`,
    operator: randomOperator(),
  });

  persist();

  // Write-back to Shopify (fire-and-forget)
  if (nextStatus === 'scanning') {
    tagForDraftOrder(job.draftOrderId, 'digitising');
  } else if (nextStatus === 'reshelved') {
    tagForDraftOrder(job.draftOrderId, 'rt:reshelved');
  }

  return job;
}

export function setRefTrackerStatus(
  jobId: string,
  status: RefTrackerStatus,
  note?: string,
): RefTrackerJob {
  const s = loadStore();
  const job = s.refTrackerJobs[jobId];
  if (!job) throw new Error(`RefTracker job ${jobId} not found`);

  const now = new Date().toISOString();
  job.status = status;
  job.location = LOCATION_MAP[status];
  job.updatedAt = now;
  job.events.push({
    timestamp: now,
    note: note || `Status set to ${status}`,
    operator: randomOperator(),
  });

  persist();

  // Write-back to Shopify (fire-and-forget)
  if (status === 'scanning') {
    tagForDraftOrder(job.draftOrderId, 'digitising');
  } else if (status === 'reshelved') {
    tagForDraftOrder(job.draftOrderId, 'rt:reshelved');
  }

  return job;
}

export function createTechOneWorkOrder(draftOrderId: number, estimate: number): TechOneWorkOrder {
  const s = loadStore();
  woCounter++;
  const year = new Date().getFullYear();
  const id = `WO-${year}-${String(woCounter).padStart(5, '0')}`;
  const now = new Date().toISOString();

  const defaultCostLines: TechOneCostLine[] = [
    {
      description: 'Item retrieval & handling',
      category: 'Labour',
      amount: Math.round(estimate * 0.2),
    },
    {
      description: 'High-resolution digitisation',
      category: 'Service',
      amount: Math.round(estimate * 0.5),
    },
    {
      description: 'Quality assurance & metadata',
      category: 'Labour',
      amount: Math.round(estimate * 0.2),
    },
    {
      description: 'Digital storage & delivery',
      category: 'Infrastructure',
      amount: Math.round(estimate * 0.1),
    },
  ];

  const wo: TechOneWorkOrder = {
    id,
    draftOrderId,
    status: 'draft',
    costCentre: 'CC-DIGI-001',
    budgetCode: 'BUD-ARCH-2026',
    costLines: defaultCostLines,
    totalEstimate: estimate,
    totalActual: 0,
    approvedBy: null,
    createdAt: now,
    updatedAt: now,
  };

  s.techOneWorkOrders[id] = wo;
  persist();
  return wo;
}

export function advanceTechOneWorkOrder(workOrderId: string): TechOneWorkOrder {
  const s = loadStore();
  const wo = s.techOneWorkOrders[workOrderId];
  if (!wo) throw new Error(`TechOne work order ${workOrderId} not found`);

  const idx = TECHONE_STATUS_ORDER.indexOf(wo.status);
  if (idx >= TECHONE_STATUS_ORDER.length - 1) {
    throw new Error(`Work order ${workOrderId} is already at final status: ${wo.status}`);
  }

  const nextStatus = TECHONE_STATUS_ORDER[idx + 1];
  const now = new Date().toISOString();

  wo.status = nextStatus;
  wo.updatedAt = now;

  if (nextStatus === 'approved') {
    wo.approvedBy = 'M. Director';
    wo.totalActual = wo.totalEstimate; // Payment received
  }
  if (nextStatus === 'closed') {
    wo.totalActual = wo.totalEstimate;
  }

  persist();

  // Write-back to Shopify (fire-and-forget)
  if (nextStatus === 'approved') {
    tagForDraftOrder(wo.draftOrderId, 'techone:approved');
    updateNoteForDraftOrder(wo.draftOrderId, buildCostNote(wo));
    updateDraftOrderPrice(wo.draftOrderId, wo.totalEstimate.toFixed(2));
  } else if (nextStatus === 'closed') {
    tagForDraftOrder(wo.draftOrderId, 'techone:closed');
  }

  return wo;
}

export function setTechOneStatus(workOrderId: string, status: TechOneStatus): TechOneWorkOrder {
  const s = loadStore();
  const wo = s.techOneWorkOrders[workOrderId];
  if (!wo) throw new Error(`TechOne work order ${workOrderId} not found`);

  const now = new Date().toISOString();
  wo.status = status;
  wo.updatedAt = now;

  if (status === 'approved' && !wo.approvedBy) {
    wo.approvedBy = 'M. Director';
    wo.totalActual = wo.totalEstimate; // Payment received
  }
  if (status === 'closed') {
    wo.totalActual = wo.totalEstimate;
  }

  persist();

  // Write-back to Shopify (fire-and-forget)
  if (status === 'approved') {
    tagForDraftOrder(wo.draftOrderId, 'techone:approved');
    updateNoteForDraftOrder(wo.draftOrderId, buildCostNote(wo));
    updateDraftOrderPrice(wo.draftOrderId, wo.totalEstimate.toFixed(2));
  } else if (status === 'closed') {
    tagForDraftOrder(wo.draftOrderId, 'techone:closed');
  }

  return wo;
}

export function addTechOneCostLine(
  workOrderId: string,
  costLine: TechOneCostLine,
): TechOneWorkOrder {
  const s = loadStore();
  const wo = s.techOneWorkOrders[workOrderId];
  if (!wo) throw new Error(`TechOne work order ${workOrderId} not found`);

  wo.costLines.push(costLine);
  wo.totalActual += costLine.amount;
  wo.updatedAt = new Date().toISOString();

  persist();

  // Write-back cost summary to Shopify (fire-and-forget)
  updateNoteForDraftOrder(wo.draftOrderId, buildCostNote(wo));

  return wo;
}

export function getIntegrationState(draftOrderId: number): IntegrationState {
  const s = loadStore();

  const refTracker =
    Object.values(s.refTrackerJobs).find((j) => j.draftOrderId === draftOrderId) ?? null;

  const techOne =
    Object.values(s.techOneWorkOrders).find((w) => w.draftOrderId === draftOrderId) ?? null;

  return { draftOrderId, refTracker, techOne };
}

export function getAllIntegrations(): IntegrationState[] {
  const s = loadStore();
  const draftOrderIds = new Set<number>();

  for (const job of Object.values(s.refTrackerJobs)) {
    draftOrderIds.add(job.draftOrderId);
  }
  for (const wo of Object.values(s.techOneWorkOrders)) {
    draftOrderIds.add(wo.draftOrderId);
  }

  return Array.from(draftOrderIds).map((id) => getIntegrationState(id));
}

export function getAllRefTrackerJobs(): RefTrackerJob[] {
  return Object.values(loadStore().refTrackerJobs);
}

export function getRefTrackerJob(jobId: string): RefTrackerJob | null {
  return loadStore().refTrackerJobs[jobId] ?? null;
}

export function getAllTechOneWorkOrders(): TechOneWorkOrder[] {
  return Object.values(loadStore().techOneWorkOrders);
}

export function getTechOneWorkOrder(workOrderId: string): TechOneWorkOrder | null {
  return loadStore().techOneWorkOrders[workOrderId] ?? null;
}

export function resetStore(): void {
  store = emptyStore();
  persist();
}
