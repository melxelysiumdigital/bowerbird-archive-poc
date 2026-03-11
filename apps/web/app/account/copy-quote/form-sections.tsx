import { Alert, AlertDescription } from '@bowerbird-poc/ui/components/alert';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Input } from '@bowerbird-poc/ui/components/input';
import { Label } from '@bowerbird-poc/ui/components/label';
import { Textarea } from '@bowerbird-poc/ui/components/textarea';
import { Info, Send, Upload } from 'lucide-react';

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const ACCESS_STATUSES = ['Open', 'Open with exception', 'Closed', 'Not yet examined'];

// ─── Helpers ────────────────────────────────────────────────

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b pb-5">
      <h4 className="mb-4 text-sm font-bold tracking-wider uppercase">{title}</h4>
      {children}
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <FormField label={label} required={required}>
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
    </FormField>
  );
}

// ─── Contact details section ────────────────────────────────

export function ContactSection({
  contactPref,
  setContactPref,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
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
}: {
  contactPref: string;
  setContactPref: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  street: string;
  setStreet: (v: string) => void;
  suburb: string;
  setSuburb: (v: string) => void;
  addrState: string;
  setAddrState: (v: string) => void;
  postcode: string;
  setPostcode: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
}) {
  return (
    <FormSection title="Your Contact Details">
      <div className="flex flex-col gap-3">
        <SelectField
          label="How would you prefer us to contact you?"
          value={contactPref}
          onChange={setContactPref}
          options={['By email', 'By letter']}
        />
        <FormField label="Your name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Email address" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </FormField>
        <FormField label="Telephone (business hours)">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        {contactPref === 'By letter' && (
          <>
            <FormField label="Street or PO Box">
              <Input value={street} onChange={(e) => setStreet(e.target.value)} />
            </FormField>
            <FormField label="Suburb or town">
              <Input value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="State"
                value={addrState}
                onChange={setAddrState}
                options={AU_STATES}
              />
              <FormField label="Postcode">
                <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
              </FormField>
            </div>
            <SelectField
              label="Country"
              value={country}
              onChange={setCountry}
              options={['Australia', 'New Zealand', 'United Kingdom', 'United States', 'Other']}
            />
          </>
        )}
      </div>
    </FormSection>
  );
}

// ─── Record details section ─────────────────────────────────

export function RecordSection({
  itemTitle,
  setItemTitle,
  seriesNumber,
  setSeriesNumber,
  controlSymbol,
  setControlSymbol,
  itemId,
  setItemId,
  location,
  setLocation,
  accessStatus,
  setAccessStatus,
}: {
  itemTitle: string;
  setItemTitle: (v: string) => void;
  seriesNumber: string;
  setSeriesNumber: (v: string) => void;
  controlSymbol: string;
  setControlSymbol: (v: string) => void;
  itemId: string;
  setItemId: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  accessStatus: string;
  setAccessStatus: (v: string) => void;
}) {
  return (
    <FormSection title="Your Copy Quote Request">
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Enter details about the record for which you would like a copy quote. If you want a quote
          for more than one record, you can attach a list at the end of this form.
        </p>
        <FormField label="Item title">
          <Textarea value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} rows={3} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Series number">
            <Input value={seriesNumber} onChange={(e) => setSeriesNumber(e.target.value)} />
          </FormField>
          <FormField label="Control symbol">
            <Input value={controlSymbol} onChange={(e) => setControlSymbol(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Item ID">
            <Input value={itemId} onChange={(e) => setItemId(e.target.value)} />
          </FormField>
          <FormField label="Location of item">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </FormField>
        </div>
        <SelectField
          label="Access status"
          value={accessStatus}
          onChange={setAccessStatus}
          options={ACCESS_STATUSES}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          For records that are NOT YET EXAMINED, you will need to submit an application for access
          through the RecordSearch database.
        </p>
      </div>
    </FormSection>
  );
}

// ─── Form shell (header + chrome + submit + privacy + attachments) ──

export function FormShell({
  children,
  isSubmitting,
  isDisabled,
  onSubmit,
}: {
  children: React.ReactNode;
  isSubmitting: boolean;
  isDisabled: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-bold">Request for Copy Quote</h2>
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
          <span className="font-semibold">Standard of service:</span> We aim to respond within 30
          business days.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-5 px-6 py-5">
        {children}
        <div className="text-muted-foreground text-xs leading-relaxed">
          <span className="font-semibold">Privacy statement:</span> The National Archives of
          Australia only records personal information, including email addresses, for the purposes
          provided. We will not disclose your details without prior consent.
        </div>
        <FormSection title="Attachments">
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6">
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Upload className="size-4" />
              Select file(s)
            </Button>
            <p className="text-muted-foreground text-xs">Files may be dragged and dropped here</p>
          </div>
        </FormSection>
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
