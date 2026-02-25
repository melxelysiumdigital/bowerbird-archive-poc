'use client';

import { Check, Copy, Tag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';

const STORAGE_KEY = 'bowerbird_discount_popup_dismissed';

export interface DiscountPopupProps {
  delay?: number;
  discountCode?: string;
  enabled?: boolean;
  heading?: string;
  body?: string;
  codeLabel?: string;
  buttonText?: string;
  storageKey?: string;
}

export function DiscountPopup({
  delay = 15,
  discountCode = 'BOWERBIRD5',
  enabled = true,
  heading = "Don\u2019t leave empty-handed!",
  body = "Here\u2019s a special offer just for you \u2014 enjoy 5% off your order.",
  codeLabel = 'Use code at checkout:',
  buttonText = 'Continue shopping',
  storageKey = STORAGE_KEY,
}: DiscountPopupProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const dismiss = useCallback(() => {
    setOpen(false);
    localStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  useEffect(() => {
    if (!enabled) return;
    const alreadyDismissed = localStorage.getItem(storageKey);
    if (alreadyDismissed) return;

    const timer = setTimeout(() => setOpen(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay, enabled, storageKey]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  if (!enabled) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="max-w-md text-center sm:rounded-2xl">
        <DialogHeader className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Tag className="size-8 text-primary" />
          </div>
          <DialogTitle className="font-serif text-2xl">{heading}</DialogTitle>
          <DialogDescription className="max-w-xs">{body}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 w-full">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {codeLabel}
          </span>
          <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted bg-muted/30 px-6 py-4">
            <code className="text-2xl font-extrabold tracking-widest text-primary">
              {discountCode}
            </code>
            <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        <Button className="mt-4 w-full" onClick={dismiss}>
          {buttonText}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
