import { useRef } from 'react';
import { Upload, X, Plus, Palette, Building2, CreditCard, Ligature as FileSignature } from 'lucide-react';
import type { CompanyProfile, CustomField, AgreementDraft, PdfTheme, AgreementType } from '../../../lib/agreementBuilder/types';

interface Props {
  draft: AgreementDraft;
  onChange: (updates: Partial<AgreementDraft>) => void;
}

const AGREEMENT_TYPES: AgreementType[] = [
  'Service Agreement',
  'Sales Agreement',
  'Consulting Agreement',
  'Non-Disclosure Agreement',
  'Software Development Agreement',
  'Maintenance & Support Agreement',
  'Retainer Agreement',
  'Partnership Agreement',
  'Employment Agreement',
  'Freelance Agreement',
];

const PDF_THEMES: { value: PdfTheme; label: string; desc: string; colors: string[] }[] = [
  { value: 'bw', label: 'Black & White', desc: 'Classic monochrome', colors: ['#1a1a1a', '#ffffff', '#555555'] },
  { value: 'navy', label: 'Navy Blue', desc: 'Professional corporate', colors: ['#1a2a6c', '#f8f6f0', '#2d4190'] },
  { value: 'slate', label: 'Slate Gray', desc: 'Modern minimal', colors: ['#334155', '#f8fafc', '#64748b'] },
  { value: 'corporate-green', label: 'Corporate Green', desc: 'Finance & legal', colors: ['#14532d', '#f0fdf4', '#166534'] },
];

export default function CompanySetup({ draft, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const providerSigRef = useRef<HTMLInputElement>(null);
  const clientSigRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onChange({ companyLogo: base64 });
      localStorage.setItem('mfo_company_logo', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (field: 'providerSignature' | 'clientSignature') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { onChange({ [field]: reader.result as string }); };
    reader.readAsDataURL(file);
  };

  const updateProfile = (field: keyof CompanyProfile, value: string) => {
    const updated = { ...draft.companyProfile, [field]: value };
    onChange({ companyProfile: updated });
    localStorage.setItem('mfo_company_profile', JSON.stringify(updated));
  };

  const addCustomField = () => {
    const newField: CustomField = { id: crypto.randomUUID(), label: '', type: 'Text' };
    onChange({ customFields: [...draft.customFields, newField] });
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    onChange({ customFields: draft.customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)) });
  };

  const removeCustomField = (id: string) => {
    onChange({ customFields: draft.customFields.filter((f) => f.id !== id) });
  };

  const inputClass = 'w-full px-3 py-2.5 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors placeholder-gray-600';

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Agreement Type & Identity</h3>
        <p className="text-xs text-gray-600 mb-5">Select the type of agreement and set its core identity details.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Agreement Type <span className="text-red-400">*</span></label>
            <select
              value={draft.agreementType}
              onChange={(e) => onChange({ agreementType: e.target.value as AgreementType })}
              className={inputClass}
            >
              {AGREEMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Agreement Title <span className="text-red-400">*</span></label>
              <input type="text" value={draft.agreementTitle} onChange={(e) => onChange({ agreementTitle: e.target.value })} className={inputClass} placeholder="e.g. Service Agreement" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Agreement Number</label>
              <input type="text" value={draft.agreementNumber} onChange={(e) => onChange({ agreementNumber: e.target.value })} className={inputClass} placeholder="e.g. AGR-2026-001" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Agreement Date <span className="text-red-400">*</span></label>
              <input type="date" value={draft.agreementDate} onChange={(e) => onChange({ agreementDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Validity Period</label>
              <input type="text" value={draft.validityPeriod} onChange={(e) => onChange({ validityPeriod: e.target.value })} className={inputClass} placeholder="e.g. 12 months from date of signing" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Place of Execution</label>
              <input type="text" value={draft.placeOfExecution} onChange={(e) => onChange({ placeOfExecution: e.target.value })} className={inputClass} placeholder="e.g. Bengaluru, Karnataka" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Governing Law & Jurisdiction</label>
              <input type="text" value={draft.governingLaw} onChange={(e) => onChange({ governingLaw: e.target.value })} className={inputClass} placeholder="e.g. Laws of India, Courts of Bengaluru" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Agreement Subtitle / Description</label>
              <input type="text" value={draft.agreementSubtitle} onChange={(e) => onChange({ agreementSubtitle: e.target.value })} className={inputClass} placeholder="Brief description of the agreement" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Service Provider / Company Details</h3>
        </div>
        <p className="text-xs text-gray-600 mb-5">Your company information that will appear in the agreement header and signature block.</p>

        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-2">Company Logo</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[#1e1e2e] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B00]/40 transition-colors group"
          >
            {draft.companyLogo ? (
              <div className="relative flex flex-col items-center">
                <img src={draft.companyLogo} alt="Logo" className="max-h-20 object-contain rounded" />
                <p className="text-xs text-gray-500 mt-2 group-hover:text-[#FF6B00]">Click to change</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange({ companyLogo: '' }); localStorage.removeItem('mfo_company_logo'); }} className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-600 group-hover:text-[#FF6B00] mb-2 transition-colors" />
                <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">Upload Company Logo</p>
                <p className="text-xs text-gray-600 mt-1">PNG, JPG, SVG</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Company / Entity Name <span className="text-red-400">*</span></label>
            <input type="text" value={draft.companyProfile.companyName} onChange={(e) => updateProfile('companyName', e.target.value)} className={inputClass} placeholder="MyDesignNexus Pvt. Ltd." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Authorised Signatory Name</label>
            <input type="text" value={draft.companyProfile.signatoryName} onChange={(e) => updateProfile('signatoryName', e.target.value)} className={inputClass} placeholder="Rakshith Kumar" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Designation</label>
            <input type="text" value={draft.companyProfile.designation} onChange={(e) => updateProfile('designation', e.target.value)} className={inputClass} placeholder="Founder & CEO" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Phone / Mobile</label>
            <input type="text" value={draft.companyProfile.phone} onChange={(e) => updateProfile('phone', e.target.value)} className={inputClass} placeholder="+91 886 1241 984" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
            <input type="email" value={draft.companyProfile.email} onChange={(e) => updateProfile('email', e.target.value)} className={inputClass} placeholder="hello@company.in" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Website</label>
            <input type="text" value={draft.companyProfile.website} onChange={(e) => updateProfile('website', e.target.value)} className={inputClass} placeholder="www.company.in" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1.5">Registered Address</label>
            <input type="text" value={draft.companyProfile.address} onChange={(e) => updateProfile('address', e.target.value)} className={inputClass} placeholder="123, MG Road, Bengaluru – 560001, Karnataka" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">GSTIN</label>
            <input type="text" value={draft.companyProfile.gstin} onChange={(e) => updateProfile('gstin', e.target.value)} className={inputClass} placeholder="29ABCDE1234F1Z5" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">PAN</label>
            <input type="text" value={draft.companyProfile.pan} onChange={(e) => updateProfile('pan', e.target.value)} className={inputClass} placeholder="ABCDE1234F" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">CIN (if applicable)</label>
            <input type="text" value={draft.companyProfile.cin} onChange={(e) => updateProfile('cin', e.target.value)} className={inputClass} placeholder="U72900KA2020PTC123456" />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Bank Details</h3>
        </div>
        <p className="text-xs text-gray-600 mb-5">Bank details will appear in the payment section of the agreement.</p>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => onChange({ showBankDetails: !draft.showBankDetails })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${draft.showBankDetails ? 'bg-[#FF6B00]' : 'bg-gray-700'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${draft.showBankDetails ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
          <span className="text-xs text-gray-400">Include bank details in the agreement</span>
        </div>
        {draft.showBankDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Bank Name</label>
              <input type="text" value={draft.companyProfile.bankName} onChange={(e) => updateProfile('bankName', e.target.value)} className={inputClass} placeholder="State Bank of India" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Account Number</label>
              <input type="text" value={draft.companyProfile.bankAccount} onChange={(e) => updateProfile('bankAccount', e.target.value)} className={inputClass} placeholder="00000000000000" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">IFSC Code</label>
              <input type="text" value={draft.companyProfile.bankIfsc} onChange={(e) => updateProfile('bankIfsc', e.target.value)} className={inputClass} placeholder="SBIN0001234" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Branch</label>
              <input type="text" value={draft.companyProfile.bankBranch} onChange={(e) => updateProfile('bankBranch', e.target.value)} className={inputClass} placeholder="MG Road, Bengaluru" />
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">PDF Theme</h3>
        </div>
        <p className="text-xs text-gray-600 mb-5">Select the visual style for the printed agreement.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PDF_THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => onChange({ pdfTheme: theme.value })}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                draft.pdfTheme === theme.value
                  ? 'border-[#FF6B00] bg-[#FF6B00]/5'
                  : 'border-[#1e1e2e] hover:border-white/20 bg-[#0d0d1a]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                {theme.colors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="font-semibold text-xs text-white">{theme.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{theme.desc}</p>
              {draft.pdfTheme === theme.value && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#FF6B00] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileSignature className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Signatures</h3>
        </div>
        <p className="text-xs text-gray-600 mb-5">Upload signature images (transparent background preferred). These appear in the signature block.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['providerSignature', 'clientSignature'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs text-gray-400 mb-2">
                {field === 'providerSignature' ? 'Service Provider Signature' : 'Client Signature (if pre-signed)'}
              </label>
              <div
                onClick={() => (field === 'providerSignature' ? providerSigRef : clientSigRef).current?.click()}
                className="border-2 border-dashed border-[#1e1e2e] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B00]/40 transition-colors group min-h-[110px]"
              >
                {draft[field] ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img src={draft[field]} alt="Signature" className="max-h-14 object-contain" />
                    <p className="text-xs text-gray-500 mt-2 group-hover:text-[#FF6B00]">Click to change</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onChange({ [field]: '' }); }} className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-gray-600 group-hover:text-[#FF6B00] transition-colors mb-2" />
                    <p className="text-xs text-gray-500 group-hover:text-gray-300">Upload Signature</p>
                  </>
                )}
              </div>
              <input ref={field === 'providerSignature' ? providerSigRef : clientSigRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload(field)} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/5">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Witness 1 Name (optional)</label>
            <input type="text" value={draft.witnessName1} onChange={(e) => onChange({ witnessName1: e.target.value })} className={inputClass} placeholder="Full name of witness" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Witness 2 Name (optional)</label>
            <input type="text" value={draft.witnessName2} onChange={(e) => onChange({ witnessName2: e.target.value })} className={inputClass} placeholder="Full name of witness" />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Custom Fields</h3>
        <p className="text-xs text-gray-600 mb-4">Add custom fields that will appear in the client details section of the agreement.</p>
        <div className="space-y-3">
          {draft.customFields.map((field) => (
            <div key={field.id} className="flex items-center gap-3">
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                className={`flex-1 ${inputClass}`}
                placeholder="Field Label (e.g. Project Code)"
              />
              <select
                value={field.type}
                onChange={(e) => updateCustomField(field.id, { type: e.target.value as CustomField['type'] })}
                className="px-3 py-2.5 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Text">Text</option>
                <option value="Number">Number</option>
                <option value="Date">Date</option>
                <option value="Long Text">Long Text</option>
              </select>
              <button type="button" onClick={() => removeCustomField(field.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addCustomField} className="mt-4 flex items-center gap-2 text-sm text-[#FF6B00] hover:text-[#FF9A00] transition-colors">
          <Plus className="w-4 h-4" /> Add Custom Field
        </button>
      </div>
    </div>
  );
}
