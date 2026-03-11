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

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

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

// ─── Login prompt ─────────────────────────────────────────────

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="bg-card flex flex-col gap-6 rounded-xl border p-6 shadow-sm">
      <div className="py-4 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100">
          <Lock className="size-5 text-amber-600" />
        </div>
        <h3 className="mb-2 text-lg font-bold">Request for Copy Quote</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          This item hasn&apos;t been digitised yet. Sign in to request a copy quote.
        </p>
        <Button className="w-full gap-2" onClick={onLogin}>
          <LogIn className="size-4" />
          Sign in to request
        </Button>
      </div>
    </div>
  );
}

// ─── Success message ──────────────────────────────────────────

function SuccessMessage({ wasBundled }: { wasBundled: boolean }) {
  return (
    <div className="bg-card flex flex-col gap-6 rounded-xl border p-6 shadow-sm">
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
        <p className="text-muted-foreground mb-6 text-sm">
          {wasBundled
            ? 'This item has been added to your existing copy quote request.'
            : 'We aim to respond to inquiries within 30 business days.'}
        </p>

        {!wasBundled && (
          <div className="bg-muted mb-6 rounded-lg p-4 text-left">
            <h4 className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
              What happens next
            </h4>
            <div className="space-y-3">
              {NEXT_STEPS.map((step) => (
                <div key={step.text} className="flex items-center gap-3">
                  <step.icon className="text-primary size-4" />
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

// ─── Form section wrapper ─────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b pb-5">
      <h4 className="mb-4 text-sm font-bold tracking-wider uppercase">{title}</h4>
      {children}
    </div>
  );
}

// ─── Select field helper ──────────────────────────────────────

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs font-semibold">{label}</Label>
      <select
        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">[Select option]</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Postal address sub-section ───────────────────────────────

interface AddressState {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

function PostalAddressFields({
  addr,
  onChange,
}: {
  addr: AddressState;
  onChange: (patch: Partial<AddressState>) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <Label className="text-muted-foreground text-xs font-semibold">Street or PO Box</Label>
        <Input value={addr.street} onChange={(e) => onChange({ street: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-muted-foreground text-xs font-semibold">Suburb or town</Label>
        <Input value={addr.suburb} onChange={(e) => onChange({ suburb: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormSelect
          label="State"
          value={addr.state}
          onChange={(v) => onChange({ state: v })}
          options={AU_STATES}
        />
        <div className="flex flex-col gap-1">
          <Label className="text-muted-foreground text-xs font-semibold">Postcode</Label>
          <Input value={addr.postcode} onChange={(e) => onChange({ postcode: e.target.value })} />
        </div>
      </div>
      <FormSelect
        label="Country"
        value={addr.country}
        onChange={(v) => onChange({ country: v })}
        options={['Australia', 'New Zealand', 'United Kingdom', 'United States', 'Other']}
      />
    </>
  );
}

// ─── Contact details section ──────────────────────────────────

interface ContactState {
  name: string;
  email: string;
  phone: string;
  contactPreference: string;
  address: AddressState;
}

function ContactDetailsFields({
  contact,
  onChange,
}: {
  contact: ContactState;
  onChange: (patch: Partial<ContactState>) => void;
}) {
  return (
    <FormSection title="Your Contact Details">
      <div className="flex flex-col gap-3">
        <FormSelect
          label="How would you prefer us to contact you?"
          value={contact.contactPreference}
          onChange={(v) => onChange({ contactPreference: v })}
          options={['By email', 'By letter']}
        />

        <div className="flex flex-col gap-1">
          <Label className="text-muted-foreground text-xs font-semibold">
            Your name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={contact.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your name"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-muted-foreground text-xs font-semibold">
            Email address <span className="text-destructive">*</span>
          </Label>
          <Input
            type="email"
            value={contact.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-muted-foreground text-xs font-semibold">
            Telephone (business hours)
          </Label>
          <Input
            type="tel"
            value={contact.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(02) 1234 5678"
          />
        </div>

        {contact.contactPreference === 'By letter' && (
          <PostalAddressFields
            addr={contact.address}
            onChange={(patch) => onChange({ address: { ...contact.address, ...patch } })}
          />
        )}
      </div>
    </FormSection>
  );
}

// ─── About yourself section ───────────────────────────────────

function AboutYourselfFields({
  researcherType,
  setResearcherType,
  usedNaaBefore,
  setUsedNaaBefore,
  howHeard,
  setHowHeard,
}: {
  researcherType: string;
  setResearcherType: (v: string) => void;
  usedNaaBefore: string;
  setUsedNaaBefore: (v: string) => void;
  howHeard: string;
  setHowHeard: (v: string) => void;
}) {
  return (
    <FormSection title="Tell Us About Yourself">
      <div className="flex flex-col gap-3">
        <FormSelect
          label="What type of researcher are you?"
          value={researcherType}
          onChange={setResearcherType}
          options={RESEARCHER_TYPES}
        />
        <FormSelect
          label="Have you used the National Archives before?"
          value={usedNaaBefore}
          onChange={setUsedNaaBefore}
          options={NAA_EXPERIENCE}
        />
        <FormSelect
          label="How did you learn about the National Archives?"
          value={howHeard}
          onChange={setHowHeard}
          options={HOW_HEARD}
        />
      </div>
    </FormSection>
  );
}

// ─── Build notes string from form state ───────────────────────

function buildNotes(
  contact: ContactState,
  about: { researcherType: string; usedNaaBefore: string; howHeard: string },
  additionalInfo: string,
): string {
  const { address: addr } = contact;
  const lines = [
    `Contact preference: ${contact.contactPreference}`,
    contact.phone && `Phone: ${contact.phone}`,
    contact.contactPreference === 'By letter' &&
      [
        addr.street,
        addr.suburb,
        [addr.state, addr.postcode].filter(Boolean).join(' '),
        addr.country,
      ]
        .filter(Boolean)
        .join(', '),
    about.researcherType && `Researcher type: ${about.researcherType}`,
    about.usedNaaBefore && `Used NAA before: ${about.usedNaaBefore}`,
    about.howHeard && `How heard: ${about.howHeard}`,
    additionalInfo && `\nAdditional information:\n${additionalInfo}`,
  ].filter(Boolean);
  return lines.join('\n');
}

// ─── Form shell (header + chrome + submit) ────────────────────

function RequestFormShell({
  children,
  error,
  isSubmitting,
  isDisabled,
  onSubmit,
}: {
  children: React.ReactNode;
  error: string | null;
  isSubmitting: boolean;
  isDisabled: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-card flex flex-col gap-0 rounded-xl border shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <ScanLine className="text-primary size-5" />
          <h3 className="text-lg font-bold">Request for Copy Quote</h3>
        </div>
      </div>

      <div className="border-b px-6 py-4">
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <Info className="size-4 text-amber-600" />
          <AlertDescription className="text-xs leading-relaxed text-amber-700">
            Complete the form below to request a copy quote. After we have provided you with a
            quote, prepayment is required for copy orders. We aim to make digital copies of paper
            records (up to A3 in size) available within 30 business days of receiving your payment.
          </AlertDescription>
        </Alert>
      </div>

      <div className="border-b px-6 py-3">
        <p className="text-muted-foreground text-xs">
          <span className="font-semibold">Standard of service:</span> We aim to respond to inquiries
          within 30 business days.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5 px-6 py-5">
        {children}

        <div className="text-muted-foreground text-xs leading-relaxed">
          <span className="font-semibold">Privacy statement:</span> The National Archives of
          Australia only records personal information, including email addresses, for the purposes
          provided. We will not disclose your details without prior consent.
        </div>

        {error && (
          <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || isDisabled} className="w-full gap-2">
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

// ─── Main form ────────────────────────────────────────────────

export function DigitisationRequestForm({
  item,
  isAuthenticated,
  userEmail,
  userName,
  onLogin,
}: DigitisationRequestFormProps) {
  const { createRequest } = useDigitisationRequests();

  const [contact, setContact] = useState<ContactState>({
    name: userName || '',
    email: userEmail || '',
    phone: '',
    contactPreference: 'By email',
    address: { street: '', suburb: '', state: '', postcode: '', country: 'Australia' },
  });
  const updateContact = (patch: Partial<ContactState>) =>
    setContact((prev) => ({ ...prev, ...patch }));

  const [researcherType, setResearcherType] = useState('');
  const [usedNaaBefore, setUsedNaaBefore] = useState('');
  const [howHeard, setHowHeard] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [wasBundled, setWasBundled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email || !contact.name) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const [firstName, ...rest] = contact.name.trim().split(' ');
      const result = await createRequest({
        email: contact.email,
        firstName: firstName || '',
        lastName: rest.join(' '),
        notes: buildNotes(contact, { researcherType, usedNaaBefore, howHeard }, additionalInfo),
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

  if (!isAuthenticated) return <LoginPrompt onLogin={onLogin} />;
  if (isSuccess) return <SuccessMessage wasBundled={wasBundled} />;

  return (
    <RequestFormShell
      error={error}
      isSubmitting={isSubmitting}
      isDisabled={!contact.email || !contact.name}
      onSubmit={handleSubmit}
    >
      <ContactDetailsFields contact={contact} onChange={updateContact} />

      <AboutYourselfFields
        researcherType={researcherType}
        setResearcherType={setResearcherType}
        usedNaaBefore={usedNaaBefore}
        setUsedNaaBefore={setUsedNaaBefore}
        howHeard={howHeard}
        setHowHeard={setHowHeard}
      />

      <FormSection title="Additional Information">
        <Textarea
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="If you are looking for mention of an individual in a record (e.g. a name in a passenger list) please provide that person's name here."
          rows={4}
        />
      </FormSection>
    </RequestFormShell>
  );
}
