import { useEffect, useState } from 'react';
import { X, Plus, Phone, Mail, Building2, Calendar, Tag, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import {
  DEAL_STAGES, DEAL_STAGE_HEADER_COLORS, DEAL_PRIORITY_COLORS,
  DEAL_ACTIVITY_TYPES, ACTIVITY_TYPE_COLORS,
} from '../../../../lib/pipeline/constants';
import type { PipelineDeal, PipelineDealActivity } from '../../../../lib/pipeline/types';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';

interface Props {
  deal: PipelineDeal;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function DealDetailModal({ deal, onClose, onEdit, onRefresh }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'activity'>('overview');
  const [activities, setActivities] = useState<PipelineDealActivity[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actForm, setActForm] = useState({ activity_type: 'Note', description: '', activity_date: new Date().toISOString().split('T')[0], follow_up_date: '' });

  const loadActivities = async () => {
    const { data } = await supabase.from('pipeline_deal_activities').select('*').eq('deal_id', deal.id).order('activity_date', { ascending: false });
    setActivities(data || []);
  };

  useEffect(() => { loadActivities(); }, [deal.id]);

  const handleAddActivity = async () => {
    if (!user || !actForm.description.trim()) { toast.error('Description required'); return; }
    const { error } = await supabase.from('pipeline_deal_activities').insert({
      ...actForm,
      deal_id: deal.id,
      user_id: user.id,
      follow_up_date: actForm.follow_up_date || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Activity added');
    setActForm({ activity_type: 'Note', description: '', activity_date: new Date().toISOString().split('T')[0], follow_up_date: '' });
    setShowAddActivity(false);
    loadActivities();
  };

  const stageIdx = DEAL_STAGES.indexOf(deal.stage as any);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:w-[480px] max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-dark-800 z-10">
          <div>
            <h2 className="text-base font-semibold leading-tight">{deal.title}</h2>
            {deal.company_name && <p className="text-xs text-gray-400 mt-0.5">{deal.company_name}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button onClick={onEdit} className="px-3 py-1 text-xs rounded-lg border border-white/10 hover:bg-white/5 text-gray-300">Edit</button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-1 flex-wrap mb-1">
            {DEAL_STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-0.5">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${DEAL_STAGE_HEADER_COLORS[s]} ${s === deal.stage ? 'ring-1 ring-white/20' : 'opacity-40'}`}>{s}</span>
                {i < DEAL_STAGES.length - 1 && <ChevronRight className="w-3 h-3 text-gray-600 opacity-50" />}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm font-bold text-white">{formatINR(deal.deal_value)}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">{deal.probability}% probability</span>
            <span className="text-xs text-gray-400">·</span>
            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${DEAL_PRIORITY_COLORS[deal.priority]}`}>{deal.priority}</span>
          </div>
        </div>

        <div className="flex gap-1 px-5 py-2 border-b border-white/5">
          {(['overview', 'activity'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${tab === t ? 'bg-brand-600/20 text-brand-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'overview' && (
            <div className="space-y-3">
              {deal.contact_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-300">{deal.contact_name}</span>
                </div>
              )}
              {deal.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                  <a href={`mailto:${deal.contact_email}`} className="text-blue-400 hover:underline">{deal.contact_email}</a>
                </div>
              )}
              {deal.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-300">{deal.contact_phone}</span>
                </div>
              )}
              {deal.expected_close_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-300">Expected close: {formatDate(deal.expected_close_date)}</span>
                </div>
              )}
              {deal.source && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-300">Source: {deal.source}</span>
                </div>
              )}
              {deal.tags && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {deal.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-dark-700 text-gray-400 border border-white/5">{t}</span>
                  ))}
                </div>
              )}
              {deal.internal_notes && (
                <div className="p-3 bg-dark-700/50 rounded-xl text-xs text-gray-400 leading-relaxed mt-2">{deal.internal_notes}</div>
              )}
              {deal.stage === 'Lost' && deal.lost_reason && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-400">Lost reason: {deal.lost_reason}</div>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{activities.length} activities</p>
                <button onClick={() => setShowAddActivity((v) => !v)} className="px-3 py-1.5 text-xs rounded-lg gradient-orange text-white font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {showAddActivity && (
                <div className="p-3 bg-dark-700/50 rounded-xl space-y-3 border border-white/5">
                  <div className="grid grid-cols-2 gap-2">
                    <select value={actForm.activity_type} onChange={(e) => setActForm((p) => ({ ...p, activity_type: e.target.value }))} className={ic}>
                      {DEAL_ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="date" value={actForm.activity_date} onChange={(e) => setActForm((p) => ({ ...p, activity_date: e.target.value }))} className={ic} />
                  </div>
                  <textarea value={actForm.description} onChange={(e) => setActForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="What happened?" className={`${ic} resize-none`} />
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Follow-up Date (optional)</label>
                    <input type="date" value={actForm.follow_up_date} onChange={(e) => setActForm((p) => ({ ...p, follow_up_date: e.target.value }))} className={ic} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddActivity} className="px-3 py-1.5 gradient-orange text-white text-xs rounded-lg font-medium">Save</button>
                    <button onClick={() => setShowAddActivity(false)} className="px-3 py-1.5 border border-white/10 text-xs rounded-lg text-gray-400">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-3 p-3 bg-dark-700/30 rounded-xl">
                    <div className={`text-xs font-semibold mt-0.5 ${ACTIVITY_TYPE_COLORS[act.activity_type] || 'text-gray-400'}`}>{act.activity_type}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 leading-relaxed">{act.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500">{formatDate(act.activity_date)}</span>
                        {act.follow_up_date && <span className="text-[10px] text-amber-400">Follow-up: {formatDate(act.follow_up_date)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No activities yet</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
