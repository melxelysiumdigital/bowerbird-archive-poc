'use client';

import type { SearchItem } from '@bowerbird-poc/shared/types';
import { Button } from '@bowerbird-poc/ui/components/button';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function ResearchCentreRequest({ item }: { item: SearchItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <FileText className="text-primary size-5" />
          <span className="font-bold">Research Centre Request</span>
        </div>
        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {isOpen && (
        <div className="border-t px-5 py-4">
          <p className="text-muted-foreground mb-4 text-sm">
            Submit a request to view this item at a National Archives research centre.
          </p>
          <dl className="text-muted-foreground mb-4 space-y-1 text-sm">
            {item.title && (
              <div className="grid grid-cols-3 gap-2">
                <dt className="font-semibold">Item</dt>
                <dd className="col-span-2">{item.title}</dd>
              </div>
            )}
            {item.series && (
              <div className="grid grid-cols-3 gap-2">
                <dt className="font-semibold">Series</dt>
                <dd className="col-span-2">{item.series}</dd>
              </div>
            )}
            {item.controlSymbol && (
              <div className="grid grid-cols-3 gap-2">
                <dt className="font-semibold">Control symbol</dt>
                <dd className="col-span-2">{item.controlSymbol}</dd>
              </div>
            )}
            {item.barcode && (
              <div className="grid grid-cols-3 gap-2">
                <dt className="font-semibold">Barcode</dt>
                <dd className="col-span-2">{item.barcode}</dd>
              </div>
            )}
          </dl>
          <Button asChild className="w-full gap-2">
            <Link href="/account/copy-quote">
              <FileText className="size-4" />
              Submit Research Centre Request
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
