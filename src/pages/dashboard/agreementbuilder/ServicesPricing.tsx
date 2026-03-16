import { Plus, X, Calculator } from 'lucide-react';
import type { AgreementDraft, ServiceItem, PaymentMilestone } from '../../../lib/agreementBuilder/types';

interface Props {
  draft: AgreementDraft;
  onChange: (updates: Partial<AgreementDraft>) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN').format(n);
}

const SCHEDULE_PRESETS = [
  { value: 'split-50-50', label: '50/50 Split', desc: 'Advance on signing, balance on delivery' },
  { value: 'split-30-40-30', label: '30/40/30 Milestones', desc: 'Three-milestone payment schedule' },
  { value: 'upfront', label: 'Full Upfront', desc: '100% on agreement signing' },
  { value: 'monthly', label: 'Monthly Retainer', desc: 'Equal monthly instalments' },
  { value: 'custom', label: 'Custom', desc: 'Define your own milestones' },
] as const;

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['Project', 'Month', 'Hour', 'Day', 'Unit', 'Session', 'License', 'Item'];

function buildMilestones(type: AgreementDraft['paymentScheduleType'], total: number): PaymentMilestone[] {
  switch (type) {
    case 'split-50-50':
      return [
        { id: '1', label: 'Advance – On Agreement Signing', percentage: 50, dueOn: 'On signing', amount: Math.round(total * 0.5) },
        { id: '2', label: 'Balance – On Delivery / Go-Live', percentage: 50, dueOn: 'On delivery', amount: total - Math.round(total * 0.5) },
      ];
    case 'split-30-40-30':
      return [
        { id: '1', label: 'Milestone 1 – On Project Kickoff', percentage: 30, dueOn: 'On kickoff', amount: Math.round(total * 0.3) },
        { id: '2', label: 'Milestone 2 – On Design / Prototype Approval', percentage: 40, dueOn: 'On approval', amount: Math.round(total * 0.4) },
        { id: '3', label: 'Milestone 3 – On Final Delivery', percentage: 30, dueOn: 'On final delivery', amount: total - Math.round(total * 0.3) - Math.round(total * 0.4) },
      ];
    case 'upfront':
      return [
        { id: '1', label: 'Full Payment – On Agreement Signing', percentage: 100, dueOn: 'On signing', amount: total },
      ];
    case 'monthly':
      return [
        { id: '1', label: 'Month 1 Retainer', percentage: 100, dueOn: '1st of each month', amount: total },
      ];
    default:
      return [];
  }
}

export default function ServicesPricing({ draft, onChange }: Props) {
  const inputClass = 'w-full px-3 py-2.5 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors placeholder-gray-600';

  const subtotal = draft.services.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalGst = draft.includeGst
    ? draft.services.reduce((sum, s) => sum + (s.amount * s.gstRate) / 100, 0)
    : 0;
  const grandTotal = subtotal + totalGst;

  const updateService = (id: string, field: keyof ServiceItem, value: string | number) => {
    const services = draft.services.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: field === 'amount' || field === 'rate' || field === 'quantity' || field === 'gstRate' ? Number(value) || 0 : value };
      if (field === 'rate' || field === 'quantity') {
        updated.amount = updated.rate * updated.quantity;
      }
      return updated;
    });
    onChange({ services });
  };

  const addService = () => {
    onChange({ services: [...draft.services, { id: crypto.randomUUID(), service: '', description: '', quantity: 1, unit: 'Project', rate: 0, amount: 0, gstRate: 18 }] });
  };

  const removeService = (id: string) => {
    if (draft.services.length <= 1) return;
    onChange({ services: draft.services.filter((s) => s.id !== id) });
  };

  const handleScheduleChange = (type: AgreementDraft['paymentScheduleType']) => {
    const milestones = type !== 'custom' ? buildMilestones(type, grandTotal) : draft.paymentMilestones;
    onChange({ paymentScheduleType: type, paymentMilestones: milestones });
  };

  const addMilestone = () => {
    onChange({
      paymentMilestones: [
        ...draft.paymentMilestones,
        { id: crypto.randomUUID(), label: '', percentage: 0, dueOn: '', amount: 0 },
      ],
    });
  };

  const updateMilestone = (id: string, field: keyof PaymentMilestone, value: string | number) => {
    const milestones = draft.paymentMilestones.map((m) => {
      if (m.id !== id) return m;
      const updated = { ...m, [field]: field === 'percentage' || field === 'amount' ? Number(value) || 0 : value };
      if (field === 'percentage') updated.amount = Math.round((grandTotal * updated.percentage) / 100);
      return updated;
    });
    onChange({ paymentMilestones: milestones });
  };

  const removeMilestone = (id: string) => {
    onChange({ paymentMilestones: draft.paymentMilestones.filter((m) => m.id !== id) });
  };

  const milestoneTotal = draft.paymentMilestones.reduce((s, m) => s + (m.percentage || 0), 0);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Services & Line Items</h3>
            <p className="text-xs text-gray-600 mt-0.5">Add all services and deliverables covered under this agreement</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => onChange({ includeGst: !draft.includeGst })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${draft.includeGst ? 'bg-[#FF6B00]' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${draft.includeGst ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs text-gray-400">Include GST</span>
            </label>
          </div>
        </div>

        <div className="hidden md:grid gap-2 mb-2 px-1" style={{ gridTemplateColumns: '2fr 2fr 80px 80px 90px 90px 36px' }}>
          {['Service / Item', 'Description', 'Qty', 'Unit', 'Rate (Rs.)', draft.includeGst ? 'GST %' : 'Amount (Rs.)', ''].map((h, i) => (
            <span key={i} className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        <div className="space-y-3">
          {draft.services.map((s, idx) => (
            <div key={s.id} className="p-3 rounded-xl bg-[#0d0d1a] border border-[#1e1e2e]">
              <div className="hidden md:grid gap-2 items-center" style={{ gridTemplateColumns: '2fr 2fr 80px 80px 90px 90px 36px' }}>
                <input type="text" value={s.service} onChange={(e) => updateService(s.id, 'service', e.target.value)} className={inputClass} placeholder={`Item ${idx + 1}`} />
                <input type="text" value={s.description} onChange={(e) => updateService(s.id, 'description', e.target.value)} className={inputClass} placeholder="Description" />
                <input type="number" value={s.quantity || ''} onChange={(e) => updateService(s.id, 'quantity', e.target.value)} className={`${inputClass} text-center`} min={1} />
                <select value={s.unit} onChange={(e) => updateService(s.id, 'unit', e.target.value)} className={inputClass}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <input type="number" value={s.rate || ''} onChange={(e) => updateService(s.id, 'rate', e.target.value)} className={`${inputClass} text-right`} placeholder="0" />
                {draft.includeGst ? (
                  <select value={s.gstRate} onChange={(e) => updateService(s.id, 'gstRate', e.target.value)} className={inputClass}>
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                ) : (
                  <input type="number" value={s.amount || ''} onChange={(e) => updateService(s.id, 'amount', e.target.value)} className={`${inputClass} text-right`} placeholder="0" />
                )}
                <button type="button" onClick={() => removeService(s.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="md:hidden space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={s.service} onChange={(e) => updateService(s.id, 'service', e.target.value)} className={`flex-1 ${inputClass}`} placeholder="Service name" />
                  <button type="button" onClick={() => removeService(s.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
                <input type="text" value={s.description} onChange={(e) => updateService(s.id, 'description', e.target.value)} className={inputClass} placeholder="Description" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={s.quantity || ''} onChange={(e) => updateService(s.id, 'quantity', e.target.value)} className={inputClass} placeholder="Qty" min={1} />
                  <select value={s.unit} onChange={(e) => updateService(s.id, 'unit', e.target.value)} className={inputClass}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input type="number" value={s.rate || ''} onChange={(e) => updateService(s.id, 'rate', e.target.value)} className={`${inputClass} text-right`} placeholder="Rate" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addService} className="mt-4 flex items-center gap-2 text-sm text-[#FF6B00] hover:text-[#FF9A00] transition-colors">
          <Plus className="w-4 h-4" /> Add Line Item
        </button>

        <div className="mt-6 space-y-2 border-t border-white/5 pt-5">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Subtotal</span>
            <span>Rs. {fmt(subtotal)}</span>
          </div>
          {draft.includeGst && (
            <div className="flex justify-between text-sm text-gray-400">
              <span>GST (as applicable)</span>
              <span>Rs. {fmt(Math.round(totalGst))}</span>
            </div>
          )}
          <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-[#FF6B00]/10 to-[#FF9A00]/5 border border-[#FF6B00]/20">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#FF6B00]" />
              <span className="font-bold text-white">{draft.includeGst ? 'Grand Total (incl. GST)' : 'Total Amount'}</span>
            </div>
            <span className="text-xl font-bold text-[#FF6B00]">Rs. {fmt(Math.round(grandTotal))}</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Payment Schedule</h3>
        <p className="text-xs text-gray-600 mb-5">Select a payment schedule or define custom milestones</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {SCHEDULE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handleScheduleChange(p.value as AgreementDraft['paymentScheduleType'])}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                draft.paymentScheduleType === p.value
                  ? 'border-[#FF6B00] bg-[#FF6B00]/5'
                  : 'border-[#1e1e2e] hover:border-white/20 bg-[#0d0d1a]'
              }`}
            >
              <p className="text-xs font-semibold text-white">{p.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{p.desc}</p>
            </button>
          ))}
        </div>

        {draft.paymentMilestones.length > 0 && (
          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_36px] gap-3 px-1 mb-1">
              {['Milestone / Label', 'Percentage (%)', 'Amount (Rs.)', 'Due On', ''].map((h, i) => (
                <span key={i} className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {draft.paymentMilestones.map((m) => (
              <div key={m.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_36px] gap-3 p-3 rounded-xl bg-[#0d0d1a] border border-[#1e1e2e]">
                <input type="text" value={m.label} onChange={(e) => updateMilestone(m.id, 'label', e.target.value)} className={`w-full px-3 py-2 bg-transparent border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]`} placeholder="Milestone description" />
                <input type="number" value={m.percentage || ''} onChange={(e) => updateMilestone(m.id, 'percentage', e.target.value)} className={`w-full px-3 py-2 bg-transparent border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00] text-center`} placeholder="%" max={100} />
                <div className="flex items-center px-3 py-2 bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg text-sm text-gray-400">
                  Rs. {fmt(m.amount)}
                </div>
                <input type="text" value={m.dueOn} onChange={(e) => updateMilestone(m.id, 'dueOn', e.target.value)} className={`w-full px-3 py-2 bg-transparent border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]`} placeholder="e.g. On signing" />
                <button type="button" onClick={() => removeMilestone(m.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className={`flex items-center justify-between p-3 rounded-lg border ${milestoneTotal === 100 ? 'border-emerald-500/20 bg-emerald-500/5' : milestoneTotal > 100 ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
              <span className="text-xs text-gray-400">Total allocation:</span>
              <span className={`text-sm font-bold ${milestoneTotal === 100 ? 'text-emerald-400' : milestoneTotal > 100 ? 'text-red-400' : 'text-amber-400'}`}>
                {milestoneTotal}% {milestoneTotal === 100 ? '✓' : milestoneTotal > 100 ? '(exceeds 100%)' : '(must total 100%)'}
              </span>
            </div>
          </div>
        )}

        {draft.paymentScheduleType === 'custom' && (
          <button type="button" onClick={addMilestone} className="mt-3 flex items-center gap-2 text-sm text-[#FF6B00] hover:text-[#FF9A00] transition-colors">
            <Plus className="w-4 h-4" /> Add Milestone
          </button>
        )}
      </div>
    </div>
  );
}
