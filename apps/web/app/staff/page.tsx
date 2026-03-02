'use client';

import type { DigitisationRequest } from '@bowerbird-poc/shared/types';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';

import { IntegrationPanel } from './integration-panel';
import { RequestSelector } from './staff-components';

import { useDigitisationRequests } from '@/hooks/use-digitisation-requests';
import { useMockIntegrations } from '@/hooks/use-mock-integrations';

// ─── Page ───────────────────────────────────────────────────

export default function StaffPage() {
  const { getRequests } = useDigitisationRequests();
  const integrationApi = useMockIntegrations();

  const [email, setEmail] = useState('');
  const [requests, setRequests] = useState<DigitisationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DigitisationRequest | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchRequests = useCallback(async () => {
    if (!email.trim()) return;
    setIsLoadingRequests(true);
    setError(null);
    try {
      const data = await getRequests(email.trim());
      setRequests(data);
      if (data.length > 0) setSelectedRequest(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setIsLoadingRequests(false);
    }
  }, [email, getRequests]);

  const handleSelectRequest = useCallback((req: DigitisationRequest) => {
    setSelectedRequest(req);
  }, []);

  const handleReset = useCallback(async () => {
    try {
      await integrationApi.resetAll();
    } catch {
      // Reset failure is non-critical
    }
  }, [integrationApi]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Integration Control Panel</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Staff-only mock RefTracker &amp; TechOne management
          </p>
        </div>
        <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleReset}>
          <Trash2 className="size-4" />
          Reset All
        </Button>
      </div>

      <RequestSelector
        email={email}
        setEmail={setEmail}
        isLoadingRequests={isLoadingRequests}
        error={error}
        requests={requests}
        selectedRequestId={selectedRequest?.id}
        onFetch={handleFetchRequests}
        onSelect={handleSelectRequest}
      />

      {selectedRequest && (
        <IntegrationPanel
          key={selectedRequest.id}
          selectedRequest={selectedRequest}
          integrationApi={integrationApi}
        />
      )}
    </div>
  );
}
