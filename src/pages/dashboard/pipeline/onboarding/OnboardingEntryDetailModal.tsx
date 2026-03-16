import { useEffect, useState } from 'react';
import { X, CheckSquare, Square, ChevronRight, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatDate } from '../../../../lib/format';
import {
  ONBOARDING_PIPELINE_STAGES, ONBOARDING_STAGE_HEADER_COLORS,
  ONBOARDING_STAGE_CHECKLISTS,
} from '../../../../lib/pipeline/constants';
import type { OnboardingPipelineEntry, OnboardingStageChecklist } from '../../../../lib/pipeline/types';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';

interface Props {
  entry: OnboardingPipelineEntry;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function OnboardingEntryDetailModal({ entry, onClose, onEdit, onRefresh }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'progress' | 'notes'>('progress');
  const [checklists, setChecklists] = useState<OnboardingStageChecklist[]>([]);
  const [expandedStage, setExpandedStage] = useState(entry.current_stage);
  const [notes, setNotes] = useState(entry.notes || '');
  const [newItem, setNewItem] = useState('');
  const [addingToStage, setAddingToStage] = useState<string | null>(null);

  const loadChecklists = async () => {
    const { data } = await supabase.from('onboarding_pipeline_stage_checklist').select('*').eq('entry_id', entry.id).order('sort_order');
    setChecklists(data || []);
  };

  useEffect(() => { loadChecklists(); }, [entry.id]);

  const toggleItem = async (item: OnboardingStageChecklist) => {
    const is_checked = !item.is_checked;
    await supabase.from('onboarding_pipeline_stage_checklist').update({ is_checked, checked_at: is_checked ? new Date().toISOString() : null }).eq('id', item.id);
    setChecklists((prev) => prev.map((c) => c.id === item.id ? { ...c, is_checked, checked_at: is_checked ? new Date().toISOString() : null } : c));
  };

  const addItem = async (stage: string) => {
    if (!user || !newItem.trim()) return;
    const { data } = await supabase.from('onboarding_pipeline_stage_checklist').insert({ entry_id: entry.id, user_id: user.id, stage_name: stage, label: newItem.trim(), sort_order: 999 }).select().maybeSingle();
    if (data) setChecklists((prev) => [...prev, data]);
    setNewItem('');
    setAddingToStage(null);
  };

  const deleteItem = async (id: string) => {
    await supabase.from('onboarding_pipeline_stage_checklist').delete().eq('id', id);
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  };

  const seedStageChecklist = async (stage: string) => {
    if (!user) return;
    const existing = checklists.filter((c) => c.stage_name === stage);
    if (existing.length > 0) return;
    const items = ONBOARDING_STAGE_CHECKLISTS[stage] || [];
    if (items.length === 0) return;
    const { data } = await supabase.from('onboarding_pipeline_stage_checklist').insert(
      items.map((label, i) => ({ entry_id: entry.id, user_id: user.id, stage_name: stage, label, sort_order: i }))
    ).select();
    setChecklists((prev) => [...prev, ...(data || [])]);
  };

  const handleExpandStage = (stage: string) => {
    setExpandedStage((v) => v === stage ? '' : stage);
    seedStageChecklist(stage);
  };

  const saveNotes = async () => {
    await supabase.from('onboarding_pipeline_entries').update({ notes }).eq('id', entry.id);
    toast.success('Notes saved');
    onRefresh();
  };

  const moveToNextStage = async () => {
    const idx = ONBOARDING_PIPELINE_STAGES.indexOf(entry.current_stage as any);
    if (idx >= ONBOARDING_PIPELINE_STAGES.length - 1) return;
    const nextStage = ONBOARDING_PIPELINE_STAGES[idx + 1];
    await supabase.from('onboarding_pipeline_entries').update({ current_stage: nextStage, stage_entered_at: new Date().toISOString() }).eq('id', entry.id);
    toast.success(`Moved to ${nextStage}`);
    onRefresh();
    onClose();
  };

  const currentStageIdx = ONBOARDING_PIPELINE_STAGES.indexOf(entry.current_stage as any);
  const allDoneForCurrentStage = checklists.filter((c) => c.stage_name === entry.current_stage).every((c) => c.is_checked);
  const hasItemsForCurrentStage = checklists.some((c) => c.stage_name === entry.current_stage);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:w-[480px] max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-dark-800 z-10">
          <div>
            <h2 className="text-base font-semibold">{entry.client_name}</h2>
            {entry.client_email && <p className="text-xs text-gray-400 mt-0.5">{entry.client_email}</p>}
          </div>
          <div className="flex gap-2 shrink-0 ml-3">
            <button onClick={onEdit} className="px-3 py-1 text-xs rounded-lg border border-white/10 hover:bg-white/5 text-gray-300">Edit</button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center gap-1 flex-wrap">
            {ONBOARDING_PIPELINE_STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-0.5">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${ONBOARDING_STAGE_HEADER_COLORS[s]} ${s === entry.current_stage ? 'ring-1 ring-white/20' : i < currentStageIdx ? 'opacity-60' : 'opacity-30'}`}>{s}</span>
                {i < ONBOARDING_PIPELINE_STAGES.length - 1 && <ChevronRight className="w-3 h-3 text-gray-600 opacity-40" />}
              </div>
            ))}
          </div>
          {entry.target_go_live_date && (
            <p className="text-xs text-gray-500 mt-2">Target go-live: {formatDate(entry.target_go_live_date)}</p>
          )}
        </div>

        <div className="flex gap-1 px-5 pb-2 border-b border-white/5">
          {(['progress', 'notes'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize ${tab === t ? 'bg-brand-600/20 text-brand-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{t}</button>
          ))}
        </div>

        <div className="p-4 space-y-2">
          {tab === 'progress' && (
            <>
              {ONBOARDING_PIPELINE_STAGES.map((stage) => {
                const stageItems = checklists.filter((c) => c.stage_name === stage);
                const doneCount = stageItems.filter((c) => c.is_checked).length;
                const isExpanded = expandedStage === stage;
                const isCurrent = stage === entry.current_stage;
                const isPast = ONBOARDING_PIPELINE_STAGES.indexOf(stage as any) < currentStageIdx;

                return (
                  <div key={stage} className={`rounded-xl border ${isCurrent ? 'border-brand-500/30 bg-brand-500/5' : 'border-white/5 bg-dark-700/20'}`}>
                    <button onClick={() => handleExpandStage(stage)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${ONBOARDING_STAGE_HEADER_COLORS[stage]} ${!isCurrent && !isPast ? 'opacity-50' : ''}`}>{stage}</span>
                        {isCurrent && <span className="text-[10px] text-brand-400 font-medium">Current</span>}
                        {isPast && <span className="text-[10px] text-emerald-400 font-medium">Done</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {stageItems.length > 0 && <span className="text-xs text-gray-400">{doneCount}/{stageItems.length}</span>}
                        <ChevronRight className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-2">
                        {stageItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 group">
                            <button onClick={() => toggleItem(item)} className="shrink-0">
                              {item.is_checked ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-gray-500" />}
                            </button>
                            <span className={`text-sm flex-1 ${item.is_checked ? 'line-through text-gray-500' : 'text-gray-300'}`}>{item.label}</span>
                            <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {addingToStage === stage ? (
                          <div className="flex gap-2 mt-2">
                            <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem(stage)} placeholder="New checklist item..." className="flex-1 px-3 py-1.5 bg-dark-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500 placeholder-gray-600" autoFocus />
                            <button onClick={() => addItem(stage)} className="px-3 py-1.5 gradient-orange text-white text-xs rounded-lg font-medium">Add</button>
                            <button onClick={() => setAddingToStage(null)} className="px-2 py-1.5 border border-white/10 text-xs rounded-lg text-gray-400">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setAddingToStage(stage)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mt-1">
                            <Plus className="w-3 h-3" /> Add item
                          </button>
                        )}

                        {isCurrent && hasItemsForCurrentStage && allDoneForCurrentStage && currentStageIdx < ONBOARDING_PIPELINE_STAGES.length - 1 && (
                          <button onClick={moveToNextStage} className="mt-2 w-full py-2 gradient-orange text-white text-xs font-semibold rounded-lg">
                            Move to Next Stage →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {tab === 'notes' && (
            <div className="space-y-3">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} placeholder="Add notes about this client's onboarding..." className="w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600 resize-none" />
              <button onClick={saveNotes} className="px-4 py-2 gradient-orange text-white text-sm font-semibold rounded-xl">Save Notes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
