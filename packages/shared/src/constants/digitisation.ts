import type { DigitisationStatus } from '../types/digitisation';

export const DIGITISATION_STATUS_STYLES: Record<
  DigitisationStatus,
  { bg: string; color: string; label: string }
> = {
  pending_review: { bg: 'bg-amber-100', color: 'text-amber-700', label: 'Under Review' },
  quote_ready: { bg: 'bg-blue-100', color: 'text-blue-700', label: 'Quote Ready' },
  payment_received: {
    bg: 'bg-purple-100',
    color: 'text-purple-700',
    label: 'Payment Received',
  },
  digitising: { bg: 'bg-emerald-100', color: 'text-emerald-700', label: 'Digitising' },
  complete: { bg: 'bg-green-100', color: 'text-green-700', label: 'Complete' },
  cancelled: { bg: 'bg-red-100', color: 'text-red-700', label: 'Cancelled' },
};

/** Lucide icon names for each digitisation step */
export const DIGITISATION_STEPS = [
  { label: 'Submitted', icon: 'CircleCheckBig' },
  { label: 'Under Review', icon: 'FileSearch' },
  { label: 'Quote Ready', icon: 'FileText' },
  { label: 'Payment', icon: 'CreditCard' },
  { label: 'Digitising', icon: 'ScanLine' },
  { label: 'Complete', icon: 'Download' },
] as const;
