import { useState, useRef, useEffect } from 'react';
import { X, Plus, Upload, Image, PenTool, Trash2, ChevronDown, ChevronUp, Users, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../lib/format';
import ThemeSelector from '../../../components/ThemeSelector';
import InvoicePreviewTemplate from '../../../components/InvoicePreviewTemplate';
import type { LineItem, Quotation, BankDetails } from '../../../lib/invoicing/types';
import type { InvoiceTheme } from '../../../lib/invoiceThemes';
import { GST_RATES, UNIT_TYPES, CURRENCY_OPTIONS, PAYMENT_TERMS, INDIAN_STATES, calcTotals, numberToWords } from '../../../lib/invoicing/constants';

interface QuotationFormProps {
  quotation?: Quotation;
  isEdit?: boolean;
  onClose: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
}

const defaultItem: LineItem = { description: '', hsn_sac: '', qty: 1, unit: 'Nos', rate: 0, amount: 0, gst_rate: 18 };
const inputCls = 'w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors';

export default function QuotationForm({ quotation, isEdit, onClose }: QuotationFormProps) {
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [selectedTheme, setSelectedTheme] = useState('classic-bw');
  const [customTheme, setCustomTheme] = useState<Partial<InvoiceTheme> | null>(null);
  const [logoSignedUrl, setLogoSignedUrl] = useState('');
  const [signatureSignedUrl, setSignatureSignedUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({ account_holder_name: '', account_number: '', ifsc_code: '', bank_name: '' });

  const [sections, setSections] = useState({ theme: true, branding: false, parties: true, details: true, scope: true, items: true, bank: false, summary: true });

  const [form, setForm] = useState({
    quote_number: '', from_business_name: '', from_address: '', from_gstin: '', from_email: '', from_phone: '',
    to_client_name: '', to_address: '', to_gstin: '', to_email: '', to_phone: '',
    quote_date: new Date().toISOString().split('T')[0], valid_until: '',
    discount: 0, discount_type: 'flat', notes: '',
    terms: 'This quotation is valid for the period mentioned above.\nPrices are subject to change after the validity period.',
    currency: 'INR', payment_terms: 'Due on Receipt', scope_of_work: '', delivery_timeline: '',
  });

  const [items, setItems] = useState<LineItem[]>([{ ...defaultItem }]);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (quotation) {
      setForm({
        quote_number: quotation.quote_number, from_business_name: quotation.from_business_name,
        from_address: quotation.from_address, from_gstin: quotation.from_gstin,
        from_email: quotation.from_email, from_phone: quotation.from_phone,
        to_client_name: quotation.to_client_name, to_address: quotation.to_address,
        to_gstin: quotation.to_gstin, to_email: quotation.to_email, to_phone: quotation.to_phone || '',
        quote_date: quotation.quote_date, valid_until: quotation.valid_until || '',
        discount: quotation.discount, discount_type: quotation.discount_type || 'flat',
        notes: quotation.notes, terms: quotation.terms, currency: quotation.currency,
        payment_terms: quotation.payment_terms || 'Due on Receipt',
        scope_of_work: quotation.scope_of_work || '', delivery_timeline: quotation.delivery_timeline || '',
      });
      setItems(quotation.items.length > 0
        ? quotation.items.map((i) => ({ description: i.description, hsn_sac: i.hsn_sac || '', qty: Number(i.qty), unit: i.unit || 'Nos', rate: Number(i.rate), amount: Number(i.amount), gst_rate: Number(i.gst_rate) }))
        : [{ ...defaultItem }]);
      if ((quotation as any).theme_id) setSelectedTheme((quotation as any).theme_id);
      if ((quotation as any).custom_theme) setCustomTheme((quotation as any).custom_theme);
      if ((quotation as any).signatory_name) setSignatoryName((quotation as any).signatory_name);
      if ((quotation as any).signatory_designation) setSignatoryDesignation((quotation as any).signatory_designation);
      if (!isEdit) {
        generateNextNumber();
      }
    } else {
      loadProfileForForm();
      generateNextNumber();
    }
  }, [quotation]);

  useEffect(() => { if (user) { loadClients(); loadBrandingData(); } }, [user]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) setShowClientDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadSignedUrl = async (path: string, setter: (v: string) => void) => {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    if (data?.signedUrl) setter(data.signedUrl);
  };

  const loadBrandingData = async () => {
    if (!user) return;
    const { data: d } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!d) return;
    setBankDetails({ account_holder_name: d.bank_account_name || '', account_number: d.bank_account_number || '', ifsc_code: d.bank_ifsc_code || '', bank_name: d.bank_name || '' });
    if (d.business_logo_url) loadSignedUrl(d.business_logo_url, setLogoSignedUrl);
    if (d.signature_url) loadSignedUrl(d.signature_url, setSignatureSignedUrl);
  };

  const loadProfileForForm = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setForm((f) => ({ ...f, from_business_name: data.business_name || '', from_address: data.address || '', from_gstin: data.gstin || '', from_email: data.email || '', from_phone: data.phone || '' }));
  };

  const loadClients = async () => {
    if (!user) return;
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).eq('status', 'Active');
    if (data) setClients(data);
  };

  const generateNextNumber = async () => {
    if (!user) return;
    const { data } = await supabase.from('quotations').select('quote_number').eq('user_id', user.id).order('created_at', { ascending: false });
    const nums = (data || []).map((i) => { const m = i.quote_number.match(/QT-(\d+)/); return m ? parseInt(m[1]) : 0; });
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    setForm((f) => ({ ...f, quote_number: `QT-${String(next).padStart(3, '0')}` }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    const path = `${user.id}/business_logo`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Logo upload failed'); setUploadingLogo(false); return; }
    await supabase.from('profiles').update({ business_logo_url: path }).eq('id', user.id);
    await loadSignedUrl(path, setLogoSignedUrl);
    toast.success('Logo uploaded');
    setUploadingLogo(false);
  };

  const handleSignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingSign(true);
    const path = `${user.id}/signature`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Signature upload failed'); setUploadingSign(false); return; }
    await supabase.from('profiles').update({ signature_url: path }).eq('id', user.id);
    await loadSignedUrl(path, setSignatureSignedUrl);
    toast.success('Signature uploaded');
    setUploadingSign(false);
  };

  const selectClient = (client: Client) => {
    setForm((f) => ({ ...f, to_client_name: client.name || '', to_address: client.address || '', to_gstin: client.gstin || '', to_email: client.email || '', to_phone: client.phone || '' }));
    setShowClientDropdown(false);
  };

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[idx] as unknown as Record<string, unknown>)[field] = value;
    if (field === 'qty' || field === 'rate') updated[idx].amount = Number(updated[idx].qty) * Number(updated[idx].rate);
    setItems(updated);
  };

  const addItem = () => setItems([...items, { ...defaultItem }]);
  const removeItem = (idx: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };

  const totals = calcTotals(items, form.discount, form.discount_type);
  const fromState = (() => { const match = INDIAN_STATES.find((s) => form.from_address.toLowerCase().includes(s.toLowerCase())); return match || ''; })();
  const placeOfSupply = (() => { const match = INDIAN_STATES.find((s) => form.to_address.toLowerCase().includes(s.toLowerCase())); return match || ''; })();
  const isIntraState = placeOfSupply !== '' && fromState !== '' && placeOfSupply === fromState;
  const gstBreakdown = (() => {
    const totalGst = totals.taxAmount;
    if (form.currency !== 'INR' || !placeOfSupply) return { type: 'igst' as const, igst: totalGst, cgst: 0, sgst: 0 };
    if (isIntraState) return { type: 'intra' as const, igst: 0, cgst: totalGst / 2, sgst: totalGst / 2 };
    return { type: 'igst' as const, igst: totalGst, cgst: 0, sgst: 0 };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.to_client_name.trim()) { toast.error('Client name is required'); return; }
    if (items.some((i) => !i.description.trim())) { toast.error('All items need a description'); return; }

    setSaving(true);
    const payload = {
      quote_number: form.quote_number, from_business_name: form.from_business_name,
      from_address: form.from_address, from_gstin: form.from_gstin, from_email: form.from_email,
      from_phone: form.from_phone, to_client_name: form.to_client_name, to_address: form.to_address,
      to_gstin: form.to_gstin, to_email: form.to_email, to_phone: form.to_phone,
      quote_date: form.quote_date || null, valid_until: form.valid_until || null,
      discount: form.discount, discount_type: form.discount_type,
      subtotal: totals.subtotal, tax_amount: totals.taxAmount, total: totals.total,
      notes: form.notes, terms: form.terms, currency: form.currency,
      payment_terms: form.payment_terms, scope_of_work: form.scope_of_work, delivery_timeline: form.delivery_timeline,
      theme_id: selectedTheme,
      custom_theme: customTheme && Object.keys(customTheme).length > 0 ? customTheme : null,
      signatory_name: signatoryName,
      signatory_designation: signatoryDesignation,
    };

    try {
      if (isEdit && quotation) {
        const { error } = await supabase.from('quotations').update(payload).eq('id', quotation.id);
        if (error) { toast.error(error.message); setSaving(false); return; }
        await supabase.from('quotation_items').delete().eq('quotation_id', quotation.id);
        await supabase.from('quotation_items').insert(items.map((i) => ({ quotation_id: quotation.id, description: i.description, hsn_sac: i.hsn_sac, qty: i.qty, unit: i.unit, rate: i.rate, amount: i.amount, gst_rate: i.gst_rate })));
        toast.success('Quotation updated');
      } else {
        const { data: qt, error } = await supabase.from('quotations').insert({ ...payload, user_id: user.id, status: 'draft' }).select().single();
        if (error || !qt) { toast.error(error?.message || 'Failed to create quotation'); setSaving(false); return; }
        await supabase.from('quotation_items').insert(items.map((i) => ({ quotation_id: qt.id, description: i.description, hsn_sac: i.hsn_sac, qty: i.qty, unit: i.unit, rate: i.rate, amount: i.amount, gst_rate: i.gst_rate })));
        toast.success('Quotation created');
      }
      await supabase.from('profiles').update({ bank_account_name: bankDetails.account_holder_name, bank_account_number: bankDetails.account_number, bank_ifsc_code: bankDetails.ifsc_code, bank_name: bankDetails.bank_name }).eq('id', user.id);
      onClose();
    } catch { toast.error('Something went wrong'); } finally { setSaving(false); }
  };

  const SectionHeader = ({ title, section }: { title: string; section: keyof typeof sections }) => (
    <button type="button" onClick={() => setSections((s) => ({ ...s, [section]: !s[section] }))} className="flex items-center justify-between w-full py-2">
      <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      {sections[section] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
    </button>
  );

  const livePreview = (
    <InvoicePreviewTemplate
      ref={previewRef}
      type="quotation"
      themeId={selectedTheme}
      customThemeOverrides={customTheme}
      docNumber={form.quote_number || 'QT-001'}
      docDate={form.quote_date}
      validUntil={form.valid_until}
      fromBusinessName={form.from_business_name}
      fromAddress={form.from_address}
      fromGstin={form.from_gstin}
      fromEmail={form.from_email}
      fromPhone={form.from_phone}
      fromLogoUrl={logoSignedUrl}
      toClientName={form.to_client_name || 'Client Name'}
      toAddress={form.to_address}
      toGstin={form.to_gstin}
      toEmail={form.to_email}
      toPhone={form.to_phone}
      items={items}
      subtotal={totals.subtotal}
      taxAmount={totals.taxAmount}
      discount={form.discount}
      discountType={form.discount_type}
      total={totals.total}
      currency={form.currency}
      notes={form.notes}
      terms={form.terms}
      bankDetails={bankDetails}
      showBankDetails={showBankDetails}
      signatureUrl={signatureSignedUrl}
      signatoryName={signatoryName}
      signatoryDesignation={signatoryDesignation}
      paymentTerms={form.payment_terms}
      placeOfSupply={placeOfSupply}
      scopeOfWork={form.scope_of_work}
      deliveryTimeline={form.delivery_timeline}
    />
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto py-8 px-4">
      <div className={`mx-auto transition-all ${showLivePreview ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Quotation' : 'Create Quotation'}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLivePreview((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${showLivePreview ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
              >
                {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showLivePreview ? 'Hide Preview' : 'Live Preview'}
              </button>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className={`${showLivePreview ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : ''}`}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-white/5 pb-1"><SectionHeader title="PDF Theme & Colors" section="theme" /></div>
              {sections.theme && (
                <div className="pb-2">
                  <ThemeSelector
                    selected={selectedTheme}
                    onChange={setSelectedTheme}
                    customTheme={customTheme}
                    onCustomThemeChange={setCustomTheme}
                  />
                </div>
              )}

              <div className="border-b border-white/5 pb-1"><SectionHeader title="Logo, Signature & Signatory" section="branding" /></div>
              {sections.branding && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch gap-4 p-4 bg-dark-800 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4 flex-1">
                      {logoSignedUrl ? (<img src={logoSignedUrl} alt="Logo" className="w-14 h-14 rounded-lg object-contain bg-white p-1" />) : (<div className="w-14 h-14 rounded-lg bg-[#1a1a1a] border border-dashed border-white/20 flex items-center justify-center"><Image className="w-5 h-5 text-gray-600" /></div>)}
                      <div className="flex-1"><p className="text-xs font-medium text-gray-300">Business Logo</p><p className="text-[10px] text-gray-500">JPG, PNG, SVG. Max 2MB</p></div>
                      <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="px-2.5 py-1 text-xs font-medium rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-1"><Upload className="w-3 h-3" />{uploadingLogo ? '...' : 'Upload'}</button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                    <div className="hidden sm:block w-px bg-white/10" />
                    <div className="block sm:hidden h-px bg-white/10" />
                    <div className="flex items-center gap-4 flex-1">
                      {signatureSignedUrl ? (<img src={signatureSignedUrl} alt="Signature" className="w-14 h-10 rounded object-contain bg-white p-1" />) : (<div className="w-14 h-10 rounded bg-[#1a1a1a] border border-dashed border-white/20 flex items-center justify-center"><PenTool className="w-4 h-4 text-gray-600" /></div>)}
                      <div className="flex-1"><p className="text-xs font-medium text-gray-300">Signature</p><p className="text-[10px] text-gray-500">Max 1MB</p></div>
                      <button type="button" onClick={() => signInputRef.current?.click()} disabled={uploadingSign} className="px-2.5 py-1 text-xs font-medium rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-1"><Upload className="w-3 h-3" />{uploadingSign ? '...' : 'Upload'}</button>
                      <input ref={signInputRef} type="file" accept="image/*" className="hidden" onChange={handleSignUpload} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-dark-800 rounded-xl border border-white/5">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Signatory Name</label>
                      <input type="text" placeholder="e.g. Rahul Sharma" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Designation</label>
                      <input type="text" placeholder="e.g. Director / CEO" value={signatoryDesignation} onChange={(e) => setSignatoryDesignation(e.target.value)} className={inputCls} />
                    </div>
                    <p className="col-span-2 text-[10px] text-gray-600">Appears below the signature on the PDF as "Authorised Signatory"</p>
                  </div>
                </div>
              )}

              <div className="border-b border-white/5 pb-1"><SectionHeader title="From / To" section="parties" /></div>
              {sections.parties && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-emerald-400">From (Your Business)</h3>
                    <input type="text" placeholder="Business Name" value={form.from_business_name} onChange={(e) => setForm({ ...form, from_business_name: e.target.value })} className={inputCls} />
                    <textarea placeholder="Address" value={form.from_address} onChange={(e) => setForm({ ...form, from_address: e.target.value })} rows={2} className={inputCls + ' resize-none'} />
                    <input type="text" placeholder="GSTIN" value={form.from_gstin} onChange={(e) => setForm({ ...form, from_gstin: e.target.value })} className={inputCls} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="email" placeholder="Email" value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} className={inputCls} />
                      <input type="text" placeholder="Phone" value={form.from_phone} onChange={(e) => setForm({ ...form, from_phone: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-emerald-400">To (Client)</h3>
                      <div className="relative" ref={clientDropdownRef}>
                        <button type="button" onClick={() => setShowClientDropdown(!showClientDropdown)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"><Users className="w-3 h-3" />Select Client</button>
                        {showClientDropdown && (
                          <div className="absolute right-0 top-full mt-1 w-64 bg-dark-800 border border-white/10 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                            {clients.length === 0 ? (<p className="px-3 py-2 text-xs text-gray-500">No active clients found</p>) : clients.map((c) => (
                              <button key={c.id} type="button" onClick={() => selectClient(c)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"><span className="font-medium">{c.name}</span>{c.email && <span className="block text-[10px] text-gray-500">{c.email}</span>}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <input type="text" placeholder="Client / Business Name" value={form.to_client_name} onChange={(e) => setForm({ ...form, to_client_name: e.target.value })} className={inputCls} />
                    <textarea placeholder="Address" value={form.to_address} onChange={(e) => setForm({ ...form, to_address: e.target.value })} rows={2} className={inputCls + ' resize-none'} />
                    <input type="text" placeholder="GSTIN" value={form.to_gstin} onChange={(e) => setForm({ ...form, to_gstin: e.target.value })} className={inputCls} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="email" placeholder="Email" value={form.to_email} onChange={(e) => setForm({ ...form, to_email: e.target.value })} className={inputCls} />
                      <input type="text" placeholder="Phone" value={form.to_phone} onChange={(e) => setForm({ ...form, to_phone: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-b border-white/5 pb-1"><SectionHeader title="Document Details" section="details" /></div>
              {sections.details && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className="block text-xs text-gray-400 mb-1">Quote #</label><input type="text" value={form.quote_number} onChange={(e) => setForm({ ...form, quote_number: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-xs text-gray-400 mb-1">Quote Date</label><input type="date" value={form.quote_date} onChange={(e) => setForm({ ...form, quote_date: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-xs text-gray-400 mb-1">Valid Until</label><input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className={inputCls} /></div>
                    <div><label className="block text-xs text-gray-400 mb-1">Currency</label><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>{CURRENCY_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className="block text-xs text-gray-400 mb-1">Payment Terms</label><select value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} className={inputCls}>{PAYMENT_TERMS.map((pt) => <option key={pt} value={pt}>{pt}</option>)}</select></div>
                    <div><label className="block text-xs text-gray-400 mb-1">Delivery Timeline</label><input type="text" placeholder="e.g. 2-3 weeks" value={form.delivery_timeline} onChange={(e) => setForm({ ...form, delivery_timeline: e.target.value })} className={inputCls} /></div>
                    {form.currency === 'INR' && (<div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Place of Supply</label><div className={inputCls + ' opacity-60 cursor-not-allowed'}>{placeOfSupply || 'Auto-detected from client address'}</div></div>)}
                  </div>
                </div>
              )}

              <div className="border-b border-white/5 pb-1"><SectionHeader title="Scope of Work" section="scope" /></div>
              {sections.scope && (<div><textarea placeholder="Describe the scope of work, deliverables, milestones, and any specific requirements..." value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} rows={5} className={inputCls + ' resize-none'} /></div>)}

              <div className="border-b border-white/5 pb-1"><SectionHeader title="Line Items" section="items" /></div>
              {sections.items && (
                <div>
                  <div className="hidden md:grid grid-cols-12 gap-2 px-1 mb-2">
                    <span className="col-span-1 text-[10px] text-gray-500 font-medium">#</span>
                    <span className="col-span-3 text-[10px] text-gray-500 font-medium">Description</span>
                    <span className="col-span-1 text-[10px] text-gray-500 font-medium">HSN/SAC</span>
                    <span className="col-span-1 text-[10px] text-gray-500 font-medium">Qty</span>
                    <span className="col-span-1 text-[10px] text-gray-500 font-medium">Unit</span>
                    <span className="col-span-1 text-[10px] text-gray-500 font-medium">Rate</span>
                    <span className="col-span-1 text-[10px] text-gray-500 font-medium">GST %</span>
                    <span className="col-span-2 text-[10px] text-gray-500 font-medium text-right">Amount</span>
                    <span className="col-span-1" />
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-dark-800/50 rounded-lg p-2 md:p-0 md:bg-transparent">
                        <span className="col-span-1 text-xs text-gray-500 text-center">{idx + 1}</span>
                        <input type="text" placeholder="Item description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} className={'col-span-3 ' + inputCls} />
                        <input type="text" placeholder="HSN" value={item.hsn_sac} onChange={(e) => updateItem(idx, 'hsn_sac', e.target.value)} className={'col-span-1 ' + inputCls} />
                        <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} className={'col-span-1 ' + inputCls} min={0} />
                        <select value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className={'col-span-1 ' + inputCls}>{UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                        <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))} className={'col-span-1 ' + inputCls} min={0} />
                        <select value={item.gst_rate} onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))} className={'col-span-1 ' + inputCls}>{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select>
                        <div className="col-span-1 text-right text-sm text-gray-400 truncate">{formatCurrency(item.amount, form.currency)}</div>
                        <button type="button" onClick={() => removeItem(idx)} className="col-span-1 flex justify-center text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addItem} className="mt-3 flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"><Plus className="w-4 h-4" />Add Item</button>
                </div>
              )}

              <div className="border-b border-white/5 pb-1">
                <div className="flex items-center justify-between">
                  <SectionHeader title="Bank Details" section="bank" />
                  <label className="flex items-center gap-2 cursor-pointer mr-1">
                    <span className="text-xs text-gray-400">Show on PDF</span>
                    <button type="button" onClick={() => setShowBankDetails(!showBankDetails)} className={`w-9 h-5 rounded-full transition-colors relative ${showBankDetails ? 'bg-emerald-500' : 'bg-gray-600'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showBankDetails ? 'left-[18px]' : 'left-0.5'}`} /></button>
                  </label>
                </div>
              </div>
              {sections.bank && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-400 mb-1">Account Holder Name</label><input type="text" placeholder="Account Holder Name" value={bankDetails.account_holder_name} onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-400 mb-1">Account Number</label><input type="text" placeholder="Account Number" value={bankDetails.account_number} onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-400 mb-1">IFSC Code</label><input type="text" placeholder="IFSC Code" value={bankDetails.ifsc_code} onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-400 mb-1">Bank Name</label><input type="text" placeholder="Bank Name" value={bankDetails.bank_name} onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })} className={inputCls} /></div>
                </div>
              )}

              <div className="border-b border-white/5 pb-1"><SectionHeader title="Notes, Terms & Summary" section="summary" /></div>
              {sections.summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div><label className="block text-xs text-gray-400 mb-1">Notes</label><textarea placeholder="Any additional notes for the client..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputCls + ' resize-none'} /></div>
                    <div><label className="block text-xs text-gray-400 mb-1">Terms & Conditions</label><textarea placeholder="Validity, payment terms, etc." value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={3} className={inputCls + ' resize-none'} /></div>
                  </div>
                  <div className="bg-dark-800 rounded-xl p-4 space-y-2.5 h-fit">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">{formatCurrency(totals.subtotal, form.currency)}</span></div>
                    <div className="flex justify-between text-sm items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Discount</span>
                        <div className="flex items-center bg-dark-700 rounded-md border border-white/10 overflow-hidden">
                          <button type="button" onClick={() => setForm({ ...form, discount_type: 'flat' })} className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${form.discount_type === 'flat' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>Flat</button>
                          <button type="button" onClick={() => setForm({ ...form, discount_type: 'percentage' })} className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${form.discount_type === 'percentage' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>%</button>
                        </div>
                      </div>
                      <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} className="w-24 px-2 py-1 bg-dark-700 border border-white/10 rounded text-sm text-white text-right focus:outline-none focus:border-emerald-500/50 transition-colors" min={0} />
                    </div>
                    {totals.discountAmount > 0 && (<div className="flex justify-between text-sm"><span className="text-gray-400">Discount Amount</span><span className="text-red-400">-{formatCurrency(totals.discountAmount, form.currency)}</span></div>)}
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Taxable Amount</span><span className="text-white">{formatCurrency(totals.subtotal - totals.discountAmount, form.currency)}</span></div>
                    {form.currency === 'INR' && placeOfSupply && gstBreakdown.type === 'intra' ? (
                      <><div className="flex justify-between text-sm"><span className="text-gray-400">CGST</span><span className="text-white">{formatCurrency(gstBreakdown.cgst, form.currency)}</span></div><div className="flex justify-between text-sm"><span className="text-gray-400">SGST</span><span className="text-white">{formatCurrency(gstBreakdown.sgst, form.currency)}</span></div></>
                    ) : (<div className="flex justify-between text-sm"><span className="text-gray-400">{form.currency === 'INR' ? 'IGST' : 'Tax'}</span><span className="text-white">{formatCurrency(totals.taxAmount, form.currency)}</span></div>)}
                    <div className="border-t border-white/10 pt-2.5 mt-2.5 flex justify-between text-base font-bold"><span className="text-white">Total</span><span className="text-emerald-400">{formatCurrency(totals.total, form.currency)}</span></div>
                    {totals.total > 0 && (<p className="text-[10px] text-gray-500 text-right pt-1">{numberToWords(Math.round(totals.total))}</p>)}
                  </div>
                </div>
              )}

              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold transition-opacity disabled:opacity-50 hover:opacity-90">
                {saving ? 'Saving...' : isEdit ? 'Update Quotation' : 'Save Quotation'}
              </button>
            </form>

            {showLivePreview && (
              <div className="hidden xl:block">
                <div className="sticky top-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-gray-400 font-medium">Live Preview</span>
                  </div>
                  <div className="overflow-auto max-h-[80vh] rounded-xl shadow-2xl">
                    <div style={{ transformOrigin: 'top left', transform: 'scale(0.55)', width: '181.8%' }}>
                      {livePreview}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
