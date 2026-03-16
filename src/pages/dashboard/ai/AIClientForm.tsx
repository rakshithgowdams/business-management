import { useState } from 'react';
import { Building2, Globe, AlertTriangle, Swords, Wallet, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import {
  BUSINESS_TYPES, TEAM_SIZES, REVENUE_RANGES, BUDGET_RANGES,
  URGENCY_OPTIONS, DECISION_MAKERS, HEARD_FROM_OPTIONS, PAIN_POINTS, DEFAULT_FORM_DATA,
} from '../../../lib/ai/constants';
import type { AIFormData } from '../../../lib/ai/types';

interface Props {
  initialData?: Partial<AIFormData>;
  onSubmit: (data: AIFormData) => void;
  loading: boolean;
}

const inputCls = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const selectCls = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500';
const labelCls = 'block text-sm text-gray-400 mb-1';

export default function AIClientForm({ initialData, onSubmit, loading }: Props) {
  const [form, setForm] = useState<AIFormData>({ ...DEFAULT_FORM_DATA, ...initialData });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true, online: false, pain: false, competitor: false, budget: false, notes: false,
  });

  const set = (field: keyof AIFormData, value: string | string[]) => setForm({ ...form, [field]: value });
  const toggle = (section: string) => setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });

  const togglePain = (pain: string) => {
    const arr = form.pain_points.includes(pain)
      ? form.pain_points.filter((p) => p !== pain)
      : [...form.pain_points, pain];
    set('pain_points', arr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const SectionHeader = ({ id, icon: Icon, title, count }: { id: string; icon: React.ElementType; title: string; count?: number }) => (
    <button type="button" onClick={() => toggle(id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4.5 h-4.5 text-brand-400" />
        <span className="text-sm font-semibold text-white">{title}</span>
        {count ? <span className="text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">{count}</span> : null}
      </div>
      {expandedSections[id] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader id="identity" icon={Building2} title="Business Identity" />
        {expandedSections.identity && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className={labelCls}>Business Name *</label>
              <input type="text" required value={form.business_name} onChange={(e) => set('business_name', e.target.value)} className={inputCls} placeholder="e.g., Suresh Medical Store" />
            </div>
            <div>
              <label className={labelCls}>Owner / Contact Name</label>
              <input type="text" value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} className={inputCls} placeholder="e.g., Suresh Gowda" />
            </div>
            <div>
              <label className={labelCls}>Business Type</label>
              <select value={form.business_type} onChange={(e) => set('business_type', e.target.value)} className={selectCls}>
                <option value="">Select type</option>
                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>City *</label>
                <input type="text" required value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} placeholder="Mysuru" />
              </div>
              <div>
                <label className={labelCls}>State *</label>
                <input type="text" required value={form.state} onChange={(e) => set('state', e.target.value)} className={inputCls} placeholder="Karnataka" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Years in Business</label>
                <input type="text" value={form.years_in_business} onChange={(e) => set('years_in_business', e.target.value)} className={inputCls} placeholder="5" />
              </div>
              <div>
                <label className={labelCls}>Team Size</label>
                <select value={form.team_size} onChange={(e) => set('team_size', e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {TEAM_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Monthly Revenue</label>
                <select value={form.monthly_revenue} onChange={(e) => set('monthly_revenue', e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {REVENUE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader id="online" icon={Globe} title="Online Presence" />
        {expandedSections.online && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className={labelCls}>Website URL</label>
              <input type="url" value={form.website_url} onChange={(e) => set('website_url', e.target.value)} className={inputCls} placeholder="https://example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Instagram Handle</label>
                <input type="text" value={form.instagram_handle} onChange={(e) => set('instagram_handle', e.target.value)} className={inputCls} placeholder="@username" />
              </div>
              <div>
                <label className={labelCls}>LinkedIn URL</label>
                <input type="url" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} className={inputCls} placeholder="https://linkedin.com/..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Google Business Name</label>
                <input type="text" value={form.google_business_name} onChange={(e) => set('google_business_name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Facebook Page URL</label>
                <input type="url" value={form.facebook_page_url} onChange={(e) => set('facebook_page_url', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader id="pain" icon={AlertTriangle} title="Current Pain Points" count={form.pain_points.length} />
        {expandedSections.pain && (
          <div className="px-4 pb-4 space-y-4">
            {Object.entries(PAIN_POINTS).map(([category, points]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{category}</p>
                <div className="space-y-1.5">
                  {points.map((p) => (
                    <label key={p} className="flex items-start gap-2.5 cursor-pointer group">
                      <input type="checkbox" checked={form.pain_points.includes(p)} onChange={() => togglePain(p)} className="mt-0.5 w-4 h-4 rounded border-white/20 bg-dark-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-0" />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader id="competitor" icon={Swords} title="Competitor Info" />
        {expandedSections.competitor && (
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Competitor 1 Name</label>
                <input type="text" value={form.competitor_1_name} onChange={(e) => set('competitor_1_name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Competitor 1 Website</label>
                <input type="url" value={form.competitor_1_website} onChange={(e) => set('competitor_1_website', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Competitor 2 Name</label>
                <input type="text" value={form.competitor_2_name} onChange={(e) => set('competitor_2_name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Competitor 2 Website</label>
                <input type="url" value={form.competitor_2_website} onChange={(e) => set('competitor_2_website', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>What competitor does better</label>
              <textarea value={form.competitor_does_better} onChange={(e) => set('competitor_does_better', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className={labelCls}>What client does better</label>
              <textarea value={form.client_does_better} onChange={(e) => set('client_does_better', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader id="budget" icon={Wallet} title="Budget & Timeline" />
        {expandedSections.budget && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className={labelCls}>Budget for Digital Services</label>
              <select value={form.budget} onChange={(e) => set('budget', e.target.value)} className={selectCls}>
                <option value="">Select</option>
                {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Urgency</label>
                <select value={form.urgency} onChange={(e) => set('urgency', e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {URGENCY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Decision Maker</label>
                <select value={form.decision_maker} onChange={(e) => set('decision_maker', e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {DECISION_MAKERS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader id="notes" icon={FileText} title="Notes" />
        {expandedSections.notes && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className={labelCls}>Additional Context</label>
              <textarea value={form.additional_notes} onChange={(e) => set('additional_notes', e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="Any additional info about the business..." />
            </div>
            <div>
              <label className={labelCls}>How did they hear about us?</label>
              <select value={form.heard_from} onChange={(e) => set('heard_from', e.target.value)} className={selectCls}>
                <option value="">Select</option>
                {HEARD_FROM_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <button type="submit" disabled={loading || !form.business_name || !form.city} className="w-full py-3.5 rounded-xl gradient-orange text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand-600/20 transition-all">
        ANALYZE WITH AI
      </button>
    </form>
  );
}
