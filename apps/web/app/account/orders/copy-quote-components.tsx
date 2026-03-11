import { Badge } from '@bowerbird-poc/ui/components/badge';
import { Button } from '@bowerbird-poc/ui/components/button';
import { cn } from '@bowerbird-poc/ui/lib/utils';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import Link from 'next/link';

// ─── Types & Mock Data ───────────────────────────────────────

export interface CopyQuoteRequest {
  id: string;
  requestNumber: string;
  question: string;
  itemSummary: string;
  dateReceived: string;
  responseDate: string;
  status: string;
}

export const MOCK_COPY_QUOTES: CopyQuoteRequest[] = [
  {
    id: 'cq-1',
    requestNumber: 'NAA1000443641',
    question: 'REQUEST FOR COPY QUOTE',
    itemSummary: 'A12372 / R/16143/H / Open',
    dateReceived: '10/03/2026 10:36 AM',
    responseDate: '21/04/2026 10:00 AM',
    status: 'Unallocated (Requester entered)',
  },
  {
    id: 'cq-2',
    requestNumber: 'NAA1000443587',
    question: 'REQUEST FOR COPY QUOTE',
    itemSummary: 'B884 / SF42/518 / Open',
    dateReceived: '05/03/2026 2:14 PM',
    responseDate: '16/04/2026 2:00 PM',
    status: 'Allocated (In progress)',
  },
  {
    id: 'cq-3',
    requestNumber: 'NAA1000443201',
    question: 'REQUEST FOR COPY QUOTE',
    itemSummary: 'A1336 / 44523 / Open',
    dateReceived: '22/02/2026 9:05 AM',
    responseDate: '05/04/2026 9:00 AM',
    status: 'Completed (Quote sent)',
  },
];

// ─── Status color helper ─────────────────────────────────────

function getStatusColor(status: string): string {
  if (status.includes('Completed')) return 'bg-green-50 text-green-700';
  if (status.includes('Allocated')) return 'bg-blue-50 text-blue-700';
  return 'bg-amber-50 text-amber-700';
}

// ─── CopyQuoteCard ───────────────────────────────────────────

function CopyQuoteCard({
  quote,
  isExpanded,
  onToggle,
}: {
  quote: CopyQuoteRequest;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'bg-card overflow-hidden rounded-xl border shadow-sm transition-all',
        !isExpanded && 'hover:border-primary/40 cursor-pointer',
      )}
      onClick={() => !isExpanded && onToggle()}
    >
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 p-6',
          isExpanded && 'bg-muted/30 border-b',
        )}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">{quote.requestNumber}</span>
            <Badge
              variant="secondary"
              className={cn(getStatusColor(quote.status), 'text-[10px] tracking-wider uppercase')}
            >
              {quote.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {quote.itemSummary} &middot; Received {quote.dateReceived}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="text-primary flex items-center gap-1 text-sm font-bold"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-muted-foreground mb-3 text-sm font-bold tracking-widest uppercase">
              Request Summary
            </h3>
            <dl className="divide-y">
              {[
                ['Request #', quote.requestNumber],
                ['Question', quote.question],
                ['Item summary', quote.itemSummary],
                ['Date received', quote.dateReceived],
                ['Response date', quote.responseDate],
                ['Status', quote.status],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-3 gap-4 py-2">
                  <dt className="text-sm font-semibold">{label}</dt>
                  <dd className="text-muted-foreground col-span-2 text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert('Demo: Update or comment on this request')}
            >
              Update Request
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert('Demo: View correspondence history')}
            >
              View History
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => alert('Demo: Cancel this request')}
            >
              Cancel Request
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CopyQuotesTab ───────────────────────────────────────────

export function CopyQuotesTab({
  quotes,
  expandedQuote,
  setExpandedQuote,
}: {
  quotes: CopyQuoteRequest[];
  expandedQuote: string | null;
  setExpandedQuote: (id: string | null) => void;
}) {
  return (
    <>
      {quotes.length === 0 && (
        <div className="bg-muted/30 rounded-xl border py-16 text-center">
          <Copy className="text-muted-foreground/30 mx-auto mb-4 size-16" />
          <h3 className="mb-2 text-xl font-bold">No research centre requests yet</h3>
          <p className="text-muted-foreground mb-6">
            Submit a research centre request for records in our collection.
          </p>
          <Button asChild>
            <Link href="/account/copy-quote">Submit a Request</Link>
          </Button>
        </div>
      )}

      {quotes.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href="/account/copy-quote">New Request</Link>
            </Button>
          </div>
          {quotes.map((quote) => (
            <CopyQuoteCard
              key={quote.id}
              quote={quote}
              isExpanded={expandedQuote === quote.id}
              onToggle={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
