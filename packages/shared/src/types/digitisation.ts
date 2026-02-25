export type DigitisationStatus =
  | 'pending_review'
  | 'quote_ready'
  | 'payment_received'
  | 'digitising'
  | 'complete'
  | 'cancelled';

export interface DigitisationRequestItem {
  title: string;
  type: string;
  image: string;
}

export interface DigitisationRequest {
  id: number;
  name: string;
  status: DigitisationStatus;
  requestedAt: string;
  items: DigitisationRequestItem[];
  notes: string;
  quoteAmount: string | null;
  invoiceUrl: string | null;
  orderId: number | null;
  currentStep: number;
}

export interface CancelledRequestData {
  originalName: string;
  email: string;
  firstName: string;
  lastName: string;
  items: Array<{
    id: string;
    title: string;
    itemType: string;
    controlSymbol: string;
    barcode: string;
    series: string;
    image: string;
  }>;
  notes: string;
}
