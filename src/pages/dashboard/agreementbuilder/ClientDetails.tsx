import { useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import type { AgreementDraft, ClientDetails as ClientDetailsType } from '../../../lib/agreementBuilder/types';
import {
  SCOPE_SUGGESTIONS,
  DELIVERABLES_SUGGESTIONS,
  PAYMENT_SUGGESTIONS,
  SPECIAL_CONDITIONS_SUGGESTIONS,
} from '../../../lib/agreementBuilder/suggestions';
import AISuggestionPanel from './AISuggestionPanel';
import ClientSelectorModal from './ClientSelectorModal';

interface Props {
  draft: AgreementDraft;
  onChange: (updates: Partial<AgreementDraft>) => void;
}

function CollapsibleSection({ title, subtitle, children, defaultOpen = true }: { title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/2 transition-colors"
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
          {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function ClientDetails({ draft, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const inputClass = 'w-full px-3 py-2.5 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors placeholder-gray-600';
  const textareaClass = `${inputClass} resize-none`;

  const updateClient = (field: keyof ClientDetailsType, value: string) => {
    onChange({ client: { ...draft.client, [field]: value } });
  };

  const updateCustomFieldValue = (fieldId: string, value: string) => {
    onChange({ client: { ...draft.client, customFieldValues: { ...draft.client.customFieldValues, [fieldId]: value } } });
  };

  const handleClientSelect = (client: ClientDetailsType) => {
    onChange({ client: { ...client, customFieldValues: draft.client.customFieldValues } });
  };

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Client Details" subtitle="Party receiving the services under this agreement">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-center gap-3 py-3 mb-5 rounded-xl border-2 border-dashed border-[#FF6B00]/30 hover:border-[#FF6B00]/60 bg-[#FF6B00]/5 hover:bg-[#FF6B00]/10 transition-all text-[#FF6B00]"
        >
          <Users className="w-4 h-4" />
          <span className="font-medium text-sm">Import from Saved Clients</span>
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Client / Contact Name <span className="text-red-400">*</span></label>
            <input type="text" value={draft.client.clientName} onChange={(e) => updateClient('clientName', e.target.value)} className={inputClass} placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Company / Organisation</label>
            <input type="text" value={draft.client.companyName} onChange={(e) => updateClient('companyName', e.target.value)} className={inputClass} placeholder="Company name (if applicable)" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Phone</label>
            <input type="text" value={draft.client.phone} onChange={(e) => updateClient('phone', e.target.value)} className={inputClass} placeholder="+91 98XXX XXXXX" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
            <input type="email" value={draft.client.email} onChange={(e) => updateClient('email', e.target.value)} className={inputClass} placeholder="client@example.com" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1.5">Registered Address</label>
            <input type="text" value={draft.client.address} onChange={(e) => updateClient('address', e.target.value)} className={inputClass} placeholder="Full address including city, state, PIN" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">GSTIN</label>
            <input type="text" value={draft.client.gstin} onChange={(e) => updateClient('gstin', e.target.value)} className={inputClass} placeholder="29ABCDE1234F1Z5" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">PAN</label>
            <input type="text" value={draft.client.pan} onChange={(e) => updateClient('pan', e.target.value)} className={inputClass} placeholder="ABCDE1234F" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Authorised Signatory</label>
            <input type="text" value={draft.client.signatoryName} onChange={(e) => updateClient('signatoryName', e.target.value)} className={inputClass} placeholder="Name of person signing" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Designation / Title</label>
            <input type="text" value={draft.client.designation} onChange={(e) => updateClient('designation', e.target.value)} className={inputClass} placeholder="Director / Owner / Advocate" />
          </div>
        </div>

        {draft.customFields.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Custom Fields</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draft.customFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-xs text-gray-400 mb-1.5">{field.label || 'Untitled Field'}</label>
                  {field.type === 'Long Text' ? (
                    <textarea value={draft.client.customFieldValues[field.id] || ''} onChange={(e) => updateCustomFieldValue(field.id, e.target.value)} rows={3} className={textareaClass} />
                  ) : (
                    <input type={field.type === 'Number' ? 'number' : field.type === 'Date' ? 'date' : 'text'} value={draft.client.customFieldValues[field.id] || ''} onChange={(e) => updateCustomFieldValue(field.id, e.target.value)} className={inputClass} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Scope of Work" subtitle="Define what services will be delivered under this agreement">
        <textarea value={draft.scopeOfWork} onChange={(e) => onChange({ scopeOfWork: e.target.value })} rows={8} className={textareaClass} placeholder="Describe the scope of work in detail. Include all services, tasks, and responsibilities..." />
        <AISuggestionPanel
          label="Scope of Work"
          staticSuggestions={SCOPE_SUGGESTIONS}
          fieldContext={`Agreement Type: ${draft.agreementType}, Service: ${draft.agreementSubtitle}, Client: ${draft.client.clientName}, Company: ${draft.client.companyName}`}
          currentValue={draft.scopeOfWork}
          onSelect={(text) => onChange({ scopeOfWork: text })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Deliverables & Timeline" subtitle="List all deliverables with expected completion dates">
        <p className="text-xs text-gray-500 mb-3">Format: <span className="font-mono text-gray-400">Deliverable Name: Timeline</span> — one per line for table view, or free-form text.</p>
        <textarea value={draft.deliverables} onChange={(e) => onChange({ deliverables: e.target.value })} rows={8} className={textareaClass} placeholder="Design Mockups & Approval: Day 3 to 7 after signing&#10;Development Phase 1: Week 2 to 3&#10;Testing & QA: Week 4&#10;Go-Live: End of Week 4" />
        <AISuggestionPanel
          label="Deliverables & Timeline"
          staticSuggestions={DELIVERABLES_SUGGESTIONS}
          fieldContext={`Agreement Type: ${draft.agreementType}, Scope: ${draft.scopeOfWork.slice(0, 200)}`}
          currentValue={draft.deliverables}
          onSelect={(text) => onChange({ deliverables: text })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Payment Terms" subtitle="Outline payment conditions, modes, and deadlines">
        <textarea value={draft.paymentTerms} onChange={(e) => onChange({ paymentTerms: e.target.value })} rows={5} className={textareaClass} placeholder="Describe payment terms, modes accepted, late payment penalties, etc." />
        <AISuggestionPanel
          label="Payment Terms"
          staticSuggestions={PAYMENT_SUGGESTIONS}
          fieldContext={`Agreement Type: ${draft.agreementType}, Total: Rs. ${draft.services.reduce((s, sv) => s + sv.amount, 0)}`}
          currentValue={draft.paymentTerms}
          onSelect={(text) => onChange({ paymentTerms: text })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Special Conditions & Compliance" subtitle="Industry-specific rules, regulatory compliance, and special clauses">
        <textarea value={draft.specialConditions} onChange={(e) => onChange({ specialConditions: e.target.value })} rows={6} className={textareaClass} placeholder="Add any special conditions, regulatory compliance requirements, or industry-specific clauses..." />
        <AISuggestionPanel
          label="Special Conditions"
          staticSuggestions={SPECIAL_CONDITIONS_SUGGESTIONS}
          fieldContext={`Agreement Type: ${draft.agreementType}, Client: ${draft.client.clientName}, Industry: ${draft.client.companyName}`}
          currentValue={draft.specialConditions}
          onSelect={(text) => onChange({ specialConditions: text })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Termination Clause" subtitle="Conditions and notice period for terminating this agreement" defaultOpen={false}>
        <textarea value={draft.terminationClause} onChange={(e) => onChange({ terminationClause: e.target.value })} rows={7} className={textareaClass} />
      </CollapsibleSection>

      <CollapsibleSection title="Confidentiality & Non-Disclosure" subtitle="Protection of sensitive business information" defaultOpen={false}>
        <textarea value={draft.confidentiality} onChange={(e) => onChange({ confidentiality: e.target.value })} rows={6} className={textareaClass} />
      </CollapsibleSection>

      <CollapsibleSection title="Intellectual Property Rights" subtitle="Ownership of work product and deliverables" defaultOpen={false}>
        <textarea value={draft.intellectualProperty} onChange={(e) => onChange({ intellectualProperty: e.target.value })} rows={6} className={textareaClass} />
      </CollapsibleSection>

      <CollapsibleSection title="Limitation of Liability & Indemnification" subtitle="Caps on financial liability for both parties" defaultOpen={false}>
        <textarea value={draft.limitationOfLiability} onChange={(e) => onChange({ limitationOfLiability: e.target.value })} rows={5} className={textareaClass} />
      </CollapsibleSection>

      <CollapsibleSection title="Warranties & Representations" subtitle="Commitments and guarantees made by each party" defaultOpen={false}>
        <textarea value={draft.warranty} onChange={(e) => onChange({ warranty: e.target.value })} rows={5} className={textareaClass} />
      </CollapsibleSection>

      <CollapsibleSection title="Dispute Resolution" subtitle="Process for resolving disagreements between parties" defaultOpen={false}>
        <textarea value={draft.disputeResolution} onChange={(e) => onChange({ disputeResolution: e.target.value })} rows={6} className={textareaClass} />
      </CollapsibleSection>

      <CollapsibleSection title="Force Majeure" subtitle="Liability exclusions for unforeseeable events" defaultOpen={false}>
        <textarea value={draft.forcemajeure} onChange={(e) => onChange({ forcemajeure: e.target.value })} rows={5} className={textareaClass} />
      </CollapsibleSection>

      <CollapsibleSection title="Amendment & Notices" subtitle="How this agreement may be changed and communications handled" defaultOpen={false}>
        <textarea value={draft.amendment} onChange={(e) => onChange({ amendment: e.target.value })} rows={4} className={textareaClass} />
      </CollapsibleSection>

      <ClientSelectorModal open={modalOpen} onClose={() => setModalOpen(false)} onSelect={handleClientSelect} />
    </div>
  );
}
