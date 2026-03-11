'use client';

import { Alert, AlertDescription } from '@bowerbird-poc/ui/components/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@bowerbird-poc/ui/components/breadcrumb';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Textarea } from '@bowerbird-poc/ui/components/textarea';
import { Info, Lock, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback } from 'react';

import {
  FormSection,
  SelectField,
  ContactSection,
  RecordSection,
  FormShell,
} from './form-sections';

import { useAuth } from '@/hooks/use-auth';

// ─── Constants ──────────────────────────────────────────────

const RESEARCHER_TYPES = [
  'Academic researcher',
  'Family historian / Genealogist',
  'Government employee',
  'Journalist / Media',
  'Legal professional',
  'Student',
  'General public',
  'Other',
];

const NAA_EXPERIENCE = ['Yes', 'No'];

const HOW_HEARD = [
  'Search engine',
  'NAA website',
  'Referral',
  'Social media',
  'Academic institution',
  'Other',
];

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

// ─── Login prompt ───────────────────────────────────────────

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="bg-card mx-auto max-w-md rounded-xl border p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100">
          <Lock className="size-8 text-amber-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Sign in required</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Please sign in to submit a request for copy quote.
        </p>
        <Button className="w-full gap-2" onClick={onLogin}>
          <LogIn className="size-4" />
          Sign in
        </Button>
      </div>
    </div>
  );
}

// ─── Success view — options section ──────────────────────────

function SuccessOptions() {
  const [selectedOption, setSelectedOption] = useState('update');

  return (
    <div>
      <h3 className="mb-3 text-base font-bold">Options</h3>
      <div className="flex flex-col gap-2">
        {[
          {
            value: 'update',
            label: 'I want to update my request (or send a question or comment about it)',
          },
          { value: 'cancel', label: 'I want to cancel this request' },
          { value: 'history', label: 'I want to view the correspondence history for this request' },
        ].map((opt) => (
          <label key={opt.value} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="action"
              value={opt.value}
              checked={selectedOption === opt.value}
              onChange={() => setSelectedOption(opt.value)}
              className="accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-4"
        onClick={() => alert('This is a demo — request management is not implemented.')}
      >
        Submit
      </Button>
    </div>
  );
}

// ─── Success view — other options links ─────────────────────

function SuccessLinks() {
  return (
    <div>
      <h3 className="mb-3 text-base font-bold">Other options</h3>
      <p className="text-muted-foreground mb-2 text-sm">Other options you can take are:</p>
      <div className="flex flex-col gap-1">
        <Link
          href="/account/copy-quote"
          className="text-primary text-sm font-medium hover:underline"
        >
          Submit another request like this
        </Link>
        <Link
          href="/account/copy-quote"
          className="text-primary text-sm font-medium hover:underline"
        >
          Submit a different type of request
        </Link>
        <Link href="/account/orders" className="text-primary text-sm font-medium hover:underline">
          View your requests
        </Link>
        <Link href="/" className="text-primary text-sm font-medium hover:underline">
          Return to National Archives of Australia
        </Link>
      </div>
    </div>
  );
}

// ─── Request summary row ────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-1.5">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="text-muted-foreground col-span-2 text-sm">{value}</dd>
    </div>
  );
}

// ─── Success view ───────────────────────────────────────────

function SuccessView({ itemSummary }: { itemSummary: string }) {
  const requestNumber = `NAA${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const now = new Date();
  const receivedDate = now.toLocaleDateString('en-AU', DATE_FORMAT);
  const responseDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
    'en-AU',
    DATE_FORMAT,
  );

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-primary text-lg font-bold">Manage this request</h2>
      </div>
      <div className="border-b px-6 py-3">
        <Alert variant="default" className="border-sky-200 bg-sky-50">
          <Info className="size-4 text-sky-600" />
          <AlertDescription className="text-xs leading-relaxed text-sky-700">
            The current status of your request is displayed below. To update your request or ask
            more information about it, please select an option and click the <strong>Submit</strong>{' '}
            button.
          </AlertDescription>
        </Alert>
      </div>
      <div className="flex flex-col gap-6 px-6 py-6">
        <div>
          <h3 className="mb-3 text-base font-bold">Request summary</h3>
          <dl className="divide-y">
            <SummaryRow label="Request #" value={requestNumber} />
            <SummaryRow label="Question" value="REQUEST FOR COPY QUOTE" />
            <SummaryRow label="Item summary" value={itemSummary || '—'} />
            <SummaryRow label="Date received" value={receivedDate} />
            <SummaryRow label="Response date" value={responseDate} />
            <SummaryRow label="Status" value="Unallocated (Requester entered)" />
          </dl>
        </div>
        <SuccessOptions />
        <SuccessLinks />
      </div>
    </div>
  );
}

// ─── Copy Quote Form ────────────────────────────────────────

function CopyQuoteForm({ userEmail, userName }: { userEmail: string; userName: string }) {
  const [contactPref, setContactPref] = useState('By email');
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [suburb, setSuburb] = useState('');
  const [addrState, setAddrState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('Australia');

  const [itemTitle, setItemTitle] = useState('');
  const [seriesNumber, setSeriesNumber] = useState('');
  const [controlSymbol, setControlSymbol] = useState('');
  const [itemId, setItemId] = useState('');
  const [location, setLocation] = useState('');
  const [accessStatus, setAccessStatus] = useState('Open');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [researcherType, setResearcherType] = useState('');
  const [usedNaaBefore, setUsedNaaBefore] = useState('');
  const [howHeard, setHowHeard] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !email) return;
      setIsSubmitting(true);
      const summary = [seriesNumber, controlSymbol, accessStatus].filter(Boolean).join(' / ');
      setSubmittedSummary(summary);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 800);
    },
    [name, email, seriesNumber, controlSymbol, accessStatus],
  );

  if (isSuccess) return <SuccessView itemSummary={submittedSummary} />;

  return (
    <FormShell isSubmitting={isSubmitting} isDisabled={!name || !email} onSubmit={handleSubmit}>
      <ContactSection
        {...{ contactPref, setContactPref, name, setName, email, setEmail, phone, setPhone }}
        {...{
          street,
          setStreet,
          suburb,
          setSuburb,
          addrState,
          setAddrState,
          postcode,
          setPostcode,
          country,
          setCountry,
        }}
      />
      <RecordSection
        {...{
          itemTitle,
          setItemTitle,
          seriesNumber,
          setSeriesNumber,
          controlSymbol,
          setControlSymbol,
        }}
        {...{ itemId, setItemId, location, setLocation, accessStatus, setAccessStatus }}
      />
      <FormSection title="Additional Information">
        <Textarea
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="If you are looking for mention of an individual in a record (e.g. a name in a passenger list) please provide that person's name here."
          rows={4}
        />
      </FormSection>
      <FormSection title="Tell Us About Yourself">
        <div className="flex flex-col gap-3">
          <SelectField
            label="What type of researcher are you?"
            value={researcherType}
            onChange={setResearcherType}
            options={RESEARCHER_TYPES}
          />
          <SelectField
            label="Have you used the National Archives before?"
            value={usedNaaBefore}
            onChange={setUsedNaaBefore}
            options={NAA_EXPERIENCE}
          />
          <SelectField
            label="How did you learn about the National Archives?"
            value={howHeard}
            onChange={setHowHeard}
            options={HOW_HEARD}
          />
        </div>
      </FormSection>
    </FormShell>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function CopyQuotePage() {
  const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/account/orders">Account</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Request for Copy Quote</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}

      {!isLoading && !isAuthenticated && <LoginPrompt onLogin={loginWithRedirect} />}

      {!isLoading && isAuthenticated && (
        <CopyQuoteForm userEmail={user?.email || ''} userName={user?.name || ''} />
      )}
    </div>
  );
}
