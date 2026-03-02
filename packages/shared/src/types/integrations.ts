// ─── RefTracker (physical item tracking) ────────────────────

export type RefTrackerStatus =
  | 'pending'
  | 'retrieving'
  | 'in_transit'
  | 'at_lab'
  | 'scanning'
  | 'qc'
  | 'returning'
  | 'reshelved';

export interface RefTrackerEvent {
  timestamp: string;
  note: string;
  operator: string;
}

export interface RefTrackerJob {
  id: string;
  draftOrderId: number;
  status: RefTrackerStatus;
  barcode: string;
  itemTitle: string;
  location: string;
  events: RefTrackerEvent[];
  createdAt: string;
  updatedAt: string;
}

// ─── TechOne (financial / ERP) ──────────────────────────────

export type TechOneStatus = 'draft' | 'approved' | 'in_progress' | 'awaiting_review' | 'closed';

export interface TechOneCostLine {
  description: string;
  category: string;
  amount: number;
}

export interface TechOneWorkOrder {
  id: string;
  draftOrderId: number;
  status: TechOneStatus;
  costCentre: string;
  budgetCode: string;
  costLines: TechOneCostLine[];
  totalEstimate: number;
  totalActual: number;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Combined state ─────────────────────────────────────────

export interface IntegrationState {
  draftOrderId: number;
  refTracker: RefTrackerJob | null;
  techOne: TechOneWorkOrder | null;
}
