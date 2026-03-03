import type { RefTrackerStatus, TechOneStatus } from '../types/integrations';

// ─── RefTracker status styles ───────────────────────────────

export const REFTRACKER_STATUS_STYLES: Record<
  RefTrackerStatus,
  { bg: string; color: string; label: string }
> = {
  pending: { bg: 'bg-gray-100', color: 'text-gray-600', label: 'Pending' },
  retrieving: { bg: 'bg-amber-100', color: 'text-amber-700', label: 'Retrieving' },
  in_transit: { bg: 'bg-blue-100', color: 'text-blue-700', label: 'In Transit' },
  at_lab: { bg: 'bg-indigo-100', color: 'text-indigo-700', label: 'At Lab' },
  scanning: { bg: 'bg-violet-100', color: 'text-violet-700', label: 'Scanning' },
  qc: { bg: 'bg-orange-100', color: 'text-orange-700', label: 'Quality Check' },
  returning: { bg: 'bg-cyan-100', color: 'text-cyan-700', label: 'Returning' },
  reshelved: { bg: 'bg-green-100', color: 'text-green-700', label: 'Reshelved' },
};

export const REFTRACKER_STEPS = [
  { label: 'Pending', icon: 'Clock' },
  { label: 'Retrieving', icon: 'HandMetal' },
  { label: 'In Transit', icon: 'Truck' },
  { label: 'At Lab', icon: 'Building2' },
  { label: 'Scanning', icon: 'ScanLine' },
  { label: 'QC', icon: 'ShieldCheck' },
  { label: 'Returning', icon: 'Undo2' },
  { label: 'Reshelved', icon: 'Archive' },
] as const;

export const REFTRACKER_STATUS_ORDER: RefTrackerStatus[] = [
  'pending',
  'retrieving',
  'in_transit',
  'at_lab',
  'scanning',
  'qc',
  'returning',
  'reshelved',
];

// ─── TechOne status styles ──────────────────────────────────

export const TECHONE_STATUS_STYLES: Record<
  TechOneStatus,
  { bg: string; color: string; label: string }
> = {
  draft: { bg: 'bg-gray-100', color: 'text-gray-600', label: 'Draft' },
  approved: { bg: 'bg-blue-100', color: 'text-blue-700', label: 'Approved' },
  in_progress: { bg: 'bg-violet-100', color: 'text-violet-700', label: 'In Progress' },
  awaiting_review: { bg: 'bg-amber-100', color: 'text-amber-700', label: 'Awaiting Review' },
  closed: { bg: 'bg-green-100', color: 'text-green-700', label: 'Closed' },
};

export const TECHONE_STEPS = [
  { label: 'Draft', icon: 'FileEdit' },
  { label: 'Approved', icon: 'CheckCircle2' },
  { label: 'In Progress', icon: 'Cog' },
  { label: 'Review', icon: 'ClipboardCheck' },
  { label: 'Closed', icon: 'CircleCheckBig' },
] as const;

export const TECHONE_STATUS_ORDER: TechOneStatus[] = [
  'draft',
  'approved',
  'in_progress',
  'awaiting_review',
  'closed',
];
