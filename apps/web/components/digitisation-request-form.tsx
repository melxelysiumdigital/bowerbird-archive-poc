'use client';


import type { SearchItem } from '@bowerbird-poc/shared/types';
import { Alert, AlertDescription } from '@bowerbird-poc/ui/components/alert';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Input } from '@bowerbird-poc/ui/components/input';
import { Label } from '@bowerbird-poc/ui/components/label';
import { Textarea } from '@bowerbird-poc/ui/components/textarea';
import {
  Lock,
  LogIn,
  ScanLine,
  Send,
  Info,
  CircleCheckBig,
  ListChecks,
  FileSearch,
  FileText,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { useState } from 'react';

import { useDigitisationRequests } from '@/hooks/use-digitisation-requests';

interface DigitisationRequestFormProps {
  item: SearchItem;
  isAuthenticated: boolean;
  userEmail?: string;
  userName?: string;
  onLogin: () => void;
}

const NEXT_STEPS = [
  { icon: FileSearch, text: 'Our team reviews your request' },
  { icon: FileText, text: 'We send you a quote via email' },
  { icon: CreditCard, text: 'You approve and pay the quote' },
  { icon: ScanLine, text: 'Item is digitised and delivered' },
];

export function DigitisationRequestForm({
  item,
  isAuthenticated,
  userEmail,
  userName,
  onLogin,
}: DigitisationRequestFormProps) {
  const { createRequest } = useDigitisationRequests();
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [wasBundled, setWasBundled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const [firstName, ...rest] = name.trim().split(' ');
      const result = await createRequest({
        email,
        firstName: firstName || '',
        lastName: rest.join(' '),
        notes,
        item: {
          id: item.id,
          title: item.title,
          itemType: item.itemType,
          controlSymbol: item.controlSymbol,
          barcode: item.barcode,
          series: item.series,
          image: item.image,
        },
      });
      setWasBundled(result.bundled);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100">
            <Lock className="size-5 text-amber-600" />
          </div>
          <h3 className="mb-2 text-lg font-bold">Digitisation Request</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            This item hasn&apos;t been digitised yet. Sign in to request digitisation and receive a
            quote.
          </p>
          <Button className="w-full gap-2" onClick={onLogin}>
            <LogIn className="size-4" />
            Sign in to request
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="py-4 text-center">
          <div
            className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${wasBundled ? 'bg-blue-100' : 'bg-green-100'}`}
          >
            {wasBundled ? (
              <ListChecks className="size-6 text-blue-600" />
            ) : (
              <CircleCheckBig className="size-6 text-green-600" />
            )}
          </div>
          <h3 className="mb-2 text-lg font-bold">
            {wasBundled ? 'Item Added to Request' : 'Request Submitted'}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {wasBundled
              ? 'This item has been added to your existing digitisation request.'
              : "We've received your digitisation request and will review it shortly."}
          </p>

          {!wasBundled && (
            <div className="mb-6 rounded-lg bg-muted p-4 text-left">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What happens next
              </h4>
              <div className="space-y-3">
                {NEXT_STEPS.map((step) => (
                  <div key={step.text} className="flex items-center gap-3">
                    <step.icon className="size-4 text-primary" />
                    <span className="text-sm">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full gap-2" asChild>
            <a href="/account/orders">
              <Receipt className="size-4" />
              View Digitisation Requests
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <ScanLine className="size-5 text-primary" />
          <h3 className="text-lg font-bold">Digitisation Request</h3>
        </div>
        <p className="text-sm text-muted-foreground">Quote on request</p>
      </div>

      <Alert variant="default" className="border-amber-200 bg-amber-50">
        <Info className="size-4 text-amber-600" />
        <AlertDescription className="text-xs leading-relaxed text-amber-700">
          This item hasn&apos;t been digitised yet. Submit a request and our team will review it and
          send you a quote. You only pay once you approve the quote.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Name
          </Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notes (optional)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific requirements or notes..."
            rows={3}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || !email} className="gap-2">
          {isSubmitting ? (
            <>
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Submit Request
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
