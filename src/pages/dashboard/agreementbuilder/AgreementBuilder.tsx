import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight, Eye, Trash2, Save, FileText, Vote, Bot, Globe, Phone, Megaphone, Pencil, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import CompanySetup from './CompanySetup';
import ClientDetails from './ClientDetails';
import ServicesPricing from './ServicesPricing';
import AgreementPreview from './AgreementPreview';
import ConfirmDialog from '../../../components/ConfirmDialog';
import EmptyState from '../../../components/EmptyState';
import { formatINR } from '../../../lib/format';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import type { AgreementDraft, AgreementTemplate } from '../../../lib/agreementBuilder/types';
import {
  DEFAULT_COMPANY_PROFILE,
  DEFAULT_TERMINATION,
  DEFAULT_CONFIDENTIALITY,
  DEFAULT_INTELLECTUAL_PROPERTY,
  DEFAULT_LIMITATION_OF_LIABILITY,
  DEFAULT_WARRANTY,
  DEFAULT_DISPUTE_RESOLUTION,
  DEFAULT_FORCE_MAJEURE,
  DEFAULT_AMENDMENT,
  DEFAULT_SERVICES,
  AGREEMENT_TEMPLATES,
} from '../../../lib/agreementBuilder/types';

interface DBDraft {
  id: string;
  title: string;
  subtitle: string;
  client_name: string;
  total_amount: number;
  status: string;
  draft_data: AgreementDraft;
  created_at: string;
  updated_at: string;
}

const LS_DRAFT = 'mfo_agreement_draft';
const LS_LOGO = 'mfo_company_logo';
const LS_PROFILE = 'mfo_company_profile';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  Vote, Bot, Globe, Phone, Megaphone,
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400',
  active: 'bg-emerald-500/10 text-emerald-400',
  completed: 'bg-blue-500/10 text-blue-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

function createBlankDraft(): AgreementDraft {
  const savedLogo = localStorage.getItem(LS_LOGO) || '';
  const savedProfile = localStorage.getItem(LS_PROFILE);
  const profile = savedProfile
    ? { ...DEFAULT_COMPANY_PROFILE, ...JSON.parse(savedProfile) }
    : DEFAULT_COMPANY_PROFILE;

  return {
    agreementType: 'Service Agreement',
    agreementTitle: 'Service Agreement',
    agreementSubtitle: '',
    agreementDate: new Date().toISOString().split('T')[0],
    agreementNumber: `AGR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    validityPeriod: '12 months from date of signing',
    placeOfExecution: '',
    governingLaw: 'Laws of India, Courts of Bengaluru',
    companyLogo: savedLogo,
    companyProfile: profile,
    customFields: [],
    client: {
      clientName: '', companyName: '', phone: '', email: '',
      address: '', gstin: '', pan: '', signatoryName: '', designation: '',
      customFieldValues: {},
    },
    scopeOfWork: '',
    deliverables: '',
    paymentTerms: '',
    paymentMilestones: [],
    paymentScheduleType: 'split-50-50',
    specialConditions: '',
    terminationClause: DEFAULT_TERMINATION,
    confidentiality: DEFAULT_CONFIDENTIALITY,
    intellectualProperty: DEFAULT_INTELLECTUAL_PROPERTY,
    limitationOfLiability: DEFAULT_LIMITATION_OF_LIABILITY,
    warranty: DEFAULT_WARRANTY,
    disputeResolution: DEFAULT_DISPUTE_RESOLUTION,
    forcemajeure: DEFAULT_FORCE_MAJEURE,
    amendment: DEFAULT_AMENDMENT,
    services: DEFAULT_SERVICES.map((s) => ({ ...s, id: crypto.randomUUID() })),
    includeGst: false,
    pdfTheme: 'bw',
    providerSignature: '',
    clientSignature: '',
    showBankDetails: true,
    witnessName1: '',
    witnessName2: '',
  };
}

function migrateOldDraft(parsed: Record<string, unknown>): AgreementDraft {
  const blank = createBlankDraft();
  return {
    ...blank,
    ...parsed,
    client: {
      ...blank.client,
      ...(parsed.client as Record<string, unknown> || {}),
    },
    companyProfile: {
      ...blank.companyProfile,
      ...(parsed.companyProfile as Record<string, unknown> || {}),
    },
    agreementType: (parsed.agreementType as AgreementDraft['agreementType']) || blank.agreementType,
    agreementNumber: (parsed.agreementNumber as string) || blank.agreementNumber,
    validityPeriod: (parsed.validityPeriod as string) || blank.validityPeriod,
    placeOfExecution: (parsed.placeOfExecution as string) || blank.placeOfExecution,
    governingLaw: (parsed.governingLaw as string) || blank.governingLaw,
    paymentMilestones: (parsed.paymentMilestones as AgreementDraft['paymentMilestones']) || blank.paymentMilestones,
    paymentScheduleType: (parsed.paymentScheduleType as AgreementDraft['paymentScheduleType']) || blank.paymentScheduleType,
    intellectualProperty: (parsed.intellectualProperty as string) || blank.intellectualProperty,
    limitationOfLiability: (parsed.limitationOfLiability as string) || blank.limitationOfLiability,
    warranty: (parsed.warranty as string) || blank.warranty,
    disputeResolution: (parsed.disputeResolution as string) || blank.disputeResolution,
    forcemajeure: (parsed.forcemajeure as string) || blank.forcemajeure,
    amendment: (parsed.amendment as string) || blank.amendment,
    includeGst: (parsed.includeGst as boolean) ?? blank.includeGst,
    showBankDetails: (parsed.showBankDetails as boolean) ?? blank.showBankDetails,
    witnessName1: (parsed.witnessName1 as string) || blank.witnessName1,
    witnessName2: (parsed.witnessName2 as string) || blank.witnessName2,
    services: ((parsed.services as AgreementDraft['services']) || blank.services).map((s) => ({
      ...s,
      quantity: (s as any).quantity || 1,
      unit: (s as any).unit || 'Project',
      rate: (s as any).rate || (s as any).amount || 0,
      gstRate: (s as any).gstRate ?? 18,
    })),
  };
}

function getInitialDraft(): AgreementDraft {
  const savedDraft = localStorage.getItem(LS_DRAFT);
  if (savedDraft) {
    try {
      return migrateOldDraft(JSON.parse(savedDraft));
    } catch { /* ignore */ }
  }
  return createBlankDraft();
}

const STEPS = [
  { label: 'Setup', shortLabel: 'Setup' },
  { label: 'Client & Details', shortLabel: 'Details' },
  { label: 'Services & Pricing', shortLabel: 'Pricing' },
  { label: 'Preview & Export', shortLabel: 'Preview' },
];

export default function AgreementBuilder() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AgreementDraft>(getInitialDraft);
  const [saved, setSaved] = useState<DBDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewAgreement, setViewAgreement] = useState<DBDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showTemplates, setShowTemplates] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (user) loadAgreements();
  }, [user]);

  const loadAgreements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agreement_drafts')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });
    setSaved((data as DBDraft[]) || []);
    setLoading(false);
  };

  const saveDraft = useCallback((d: AgreementDraft) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(LS_DRAFT, JSON.stringify(d));
    }, 500);
  }, []);

  const handleChange = useCallback((updates: Partial<AgreementDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...updates };
      saveDraft(next);
      return next;
    });
  }, [saveDraft]);

  const goNext = () => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    setStep((s) => Math.min(s + 1, 3));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const goToStep = (s: number) => {
    if (s <= step || completedSteps.has(s)) setStep(s);
  };

  const handleApplyTemplate = (template: AgreementTemplate) => {
    const updates: Partial<AgreementDraft> = {
      agreementType: template.agreementType,
      agreementTitle: template.name,
      agreementSubtitle: template.subtitle,
      scopeOfWork: template.scopeOfWork,
      deliverables: template.deliverables,
      paymentTerms: template.paymentTerms,
      specialConditions: template.specialConditions,
      services: template.services.map((s) => ({ ...s, id: crypto.randomUUID() })),
    };
    handleChange(updates);
    setShowTemplates(false);
    toast.success(`"${template.name}" template applied`);
  };

  const handleSaveAgreement = async (status = 'draft') => {
    setSaving(true);
    const subtotal = draft.services.reduce((sum, s) => sum + (s.amount || 0), 0);
    const gst = draft.includeGst ? draft.services.reduce((sum, s) => sum + (s.amount * (s.gstRate || 0)) / 100, 0) : 0;
    const total = Math.round(subtotal + gst);

    const payload = {
      user_id: user!.id,
      title: draft.agreementTitle || 'Untitled',
      subtitle: draft.agreementSubtitle,
      client_name: draft.client.clientName || 'No client',
      total_amount: total,
      status,
      draft_data: draft as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from('agreement_drafts')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        toast.error('Failed to update agreement');
        setSaving(false);
        return;
      }
      toast.success('Agreement updated');
    } else {
      const { error } = await supabase
        .from('agreement_drafts')
        .insert(payload);
      if (error) {
        toast.error('Failed to save agreement');
        setSaving(false);
        return;
      }
      toast.success('Agreement saved');
    }

    await loadAgreements();
    setSaving(false);
  };

  const handleEditAgreement = (ag: DBDraft) => {
    const migrated = migrateOldDraft(ag.draft_data as unknown as Record<string, unknown>);
    setDraft(migrated);
    setEditingId(ag.id);
    setStep(0);
    setCompletedSteps(new Set());
    setViewAgreement(null);
    localStorage.setItem(LS_DRAFT, JSON.stringify(migrated));
    toast.success('Agreement loaded for editing');
  };

  const handleDeleteAgreement = async () => {
    if (!deleteId) return;
    await supabase.from('agreement_drafts').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Agreement deleted');
    loadAgreements();
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('agreement_drafts').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    toast.success(`Status updated to ${status}`);
    loadAgreements();
  };

  const handleNewDraft = () => {
    localStorage.removeItem(LS_DRAFT);
    setDraft(createBlankDraft());
    setEditingId(null);
    setStep(0);
    setCompletedSteps(new Set());
    toast.success('New draft started');
  };

  const filteredAgreements = statusFilter === 'all'
    ? saved
    : saved.filter((a) => a.status === statusFilter);

  if (viewAgreement) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewAgreement(null)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Agreements
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditAgreement(viewAgreement)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#FF6B00]/30 text-[#FF6B00] text-sm font-medium hover:bg-[#FF6B00]/10 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <select
              value={viewAgreement.status}
              onChange={(e) => {
                handleUpdateStatus(viewAgreement.id, e.target.value);
                setViewAgreement({ ...viewAgreement, status: e.target.value });
              }}
              className="px-3 py-2 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <AgreementPreview draft={migrateOldDraft(viewAgreement.draft_data as unknown as Record<string, unknown>)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agreements</h1>
          {editingId && (
            <p className="text-xs text-[#FF6B00] mt-1">Editing existing agreement</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 text-sm font-semibold rounded-lg gradient-orange text-white"
          >
            Templates
          </button>
          <button
            onClick={handleNewDraft}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Start Templates</h3>
          <p className="text-xs text-gray-500 mb-5">Select a template to pre-fill scope, deliverables, pricing, and conditions.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGREEMENT_TEMPLATES.map((t) => {
              const Icon = TEMPLATE_ICONS[t.icon] || FileText;
              const total = t.services.reduce((s, sv) => s + sv.amount, 0);
              return (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t)}
                  className="text-left p-4 rounded-xl border border-[#1e1e2e] hover:border-[#FF6B00]/40 bg-[#0d0d1a] hover:bg-[#FF6B00]/5 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center group-hover:bg-[#FF6B00]/20 transition-colors">
                      <Icon className="w-4 h-4 text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{t.name}</p>
                      <p className="text-[10px] text-[#FF6B00] font-medium">{formatINR(total)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEPPER */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <button
                onClick={() => goToStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  i === step
                    ? 'gradient-orange text-white shadow-lg shadow-orange-500/20'
                    : completedSteps.has(i)
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {completedSteps.has(i) && i !== step ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.shortLabel}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${completedSteps.has(i) ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STEP CONTENT */}
      <div>
        {step === 0 && <CompanySetup draft={draft} onChange={handleChange} />}
        {step === 1 && <ClientDetails draft={draft} onChange={handleChange} />}
        {step === 2 && <ServicesPricing draft={draft} onChange={handleChange} />}
        {step === 3 && (
          <>
            <AgreementPreview draft={draft} />
            <div className="flex flex-wrap justify-center gap-3 mt-6 print:hidden">
              <button
                onClick={() => handleSaveAgreement('draft')}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save as Draft
              </button>
              <button
                onClick={() => handleSaveAgreement('active')}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-orange text-white font-semibold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-shadow disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save & Activate
              </button>
            </div>
          </>
        )}
      </div>

      {/* NAVIGATION */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={goPrev}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {step < 3 ? (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition-shadow"
          >
            {step === 2 ? (
              <><Eye className="w-4 h-4" /> Preview Agreement</>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* SAVED AGREEMENTS LIST */}
      <div className="glass-card rounded-xl p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> All Agreements ({saved.length})
          </h3>
          <div className="flex items-center gap-1">
            {['all', 'draft', 'active', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? 'gradient-orange text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
          </div>
        ) : filteredAgreements.length > 0 ? (
          <div className="space-y-2">
            {filteredAgreements.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[#0d0d1a] border border-[#1e1e2e] hover:border-[#FF6B00]/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm truncate">{a.title || 'Untitled'}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium capitalize ${STATUS_COLORS[a.status] || STATUS_COLORS.draft}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{a.client_name || 'No client'}</span>
                    {a.subtitle && <span className="text-gray-600">{a.subtitle}</span>}
                    <span>{new Date(a.updated_at || a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span className="font-medium text-[#FF6B00]">{formatINR(a.total_amount)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button onClick={() => setViewAgreement(a)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="View">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEditAgreement(a)} className="p-2 rounded-lg hover:bg-[#FF6B00]/10 text-gray-400 hover:text-[#FF6B00] transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(a.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={statusFilter === 'all' ? 'No agreements yet' : `No ${statusFilter} agreements`}
            description="Build your first agreement using the wizard above."
          />
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Agreement"
        message="Are you sure you want to delete this agreement? This cannot be undone."
        onConfirm={handleDeleteAgreement}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
