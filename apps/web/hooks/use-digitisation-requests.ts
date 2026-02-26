'use client';

import type {
  DigitisationRequest,
  DigitisationRequestItem,
  DigitisationStatus,
  CancelledRequestData,
  AdminDraftOrder,
} from '@bowerbird-poc/shared/types';
import { useCallback } from 'react';

interface CreateRequestParams {
  email: string;
  firstName: string;
  lastName: string;
  notes: string;
  item: {
    id: string;
    title: string;
    itemType: string;
    controlSymbol: string;
    barcode: string;
    series: string;
    image: string;
  };
}

function transformDraftOrder(draft: AdminDraftOrder): DigitisationRequest {
  let status: DigitisationStatus;
  let currentStep: number;

  const orderTags = (draft.order_tags || '').split(',').map((t) => t.trim().toLowerCase());
  const isCancelled = draft.order_cancelled;
  const isFulfilled = draft.order_fulfillment === 'FULFILLED';

  if (isCancelled) {
    status = 'cancelled';
    currentStep = 0;
  } else if (isFulfilled) {
    status = 'complete';
    currentStep = 6;
  } else if (orderTags.includes('digitising')) {
    status = 'digitising';
    currentStep = 5;
  } else if (draft.status === 'completed' && draft.order_id) {
    status = 'payment_received';
    currentStep = 4;
  } else if (draft.status === 'invoice_sent') {
    status = 'quote_ready';
    currentStep = 3;
  } else {
    status = 'pending_review';
    currentStep = 2;
  }

  const items: DigitisationRequestItem[] = draft.line_items.map((li) => {
    const prop = (name: string) => li.properties.find((p) => p.name === name)?.value || '';
    return {
      title: prop('item_title') || li.title || 'Unknown item',
      type: prop('item_type'),
      image: prop('item_image'),
    };
  });

  const quoteAmount =
    parseFloat(draft.total_price) > 0 ? `$${parseFloat(draft.total_price).toFixed(2)}` : null;

  return {
    id: draft.id,
    name: draft.name,
    status,
    requestedAt: new Date(draft.created_at).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    items,
    notes: draft.note || '',
    quoteAmount,
    invoiceUrl: draft.invoice_url,
    orderId: draft.order_id,
    currentStep,
  };
}

export function useDigitisationRequests() {
  const createRequest = useCallback(
    async (params: CreateRequestParams): Promise<{ bundled: boolean }> => {
      const res = await fetch('/api/shopify/draft-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create digitisation request');
      }
      const bundled = res.status === 200;
      await res.json();
      return { bundled };
    },
    [],
  );

  const getRequests = useCallback(async (email: string): Promise<DigitisationRequest[]> => {
    const res = await fetch(`/api/shopify/draft-orders?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch digitisation requests');
    }
    const data = await res.json();
    return (data.draft_orders ?? []).map(transformDraftOrder);
  }, []);

  const cancelRequest = useCallback(async (id: number): Promise<CancelledRequestData> => {
    const res = await fetch(`/api/shopify/draft-orders?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to cancel request');
    }
    return res.json();
  }, []);

  const recreateRequest = useCallback(async (data: CancelledRequestData): Promise<void> => {
    const res = await fetch('/api/shopify/draft-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recreate: true,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        items: data.items,
        notes: data.notes,
        originalName: data.originalName,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to recreate request');
    }
  }, []);

  return { createRequest, getRequests, cancelRequest, recreateRequest };
}
