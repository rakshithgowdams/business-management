import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { ONBOARDING_PIPELINE_STAGES, ONBOARDING_STAGE_COLORS, ONBOARDING_STAGE_HEADER_COLORS } from '../../../../lib/pipeline/constants';
import type { OnboardingPipelineEntry, OnboardingStageChecklist } from '../../../../lib/pipeline/types';
import OnboardingCard from './OnboardingCard';
import OnboardingEntryDetailModal from './OnboardingEntryDetailModal';
import OnboardingEntryFormModal from './OnboardingEntryFormModal';

interface Props {
  entries: OnboardingPipelineEntry[];
  checklists: OnboardingStageChecklist[];
  onRefresh: () => void;
}

export default function OnboardingKanbanBoard({ entries, checklists, onRefresh }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragCounters = useRef<Record<string, number>>({});
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<OnboardingPipelineEntry | null>(null);
  const [editEntry, setEditEntry] = useState<Partial<OnboardingPipelineEntry> | null>(null);

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnd = () => { setDraggedId(null); setDraggingOver(null); };
  const handleDragEnter = (stage: string) => { dragCounters.current[stage] = (dragCounters.current[stage] || 0) + 1; setDraggingOver(stage); };
  const handleDragLeave = (stage: string) => { dragCounters.current[stage] = (dragCounters.current[stage] || 0) - 1; if (dragCounters.current[stage] <= 0) { dragCounters.current[stage] = 0; setDraggingOver(null); } };
  const handleDrop = async (stage: string) => {
    dragCounters.current[stage] = 0;
    setDraggingOver(null);
    if (!draggedId) return;
    const current = entries.find((e) => e.id === draggedId);
    if (!current || current.current_stage === stage) return;
    await supabase.from('onboarding_pipeline_entries').update({ current_stage: stage, stage_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', draggedId);
    onRefresh();
  };

  const enrichedEntries = entries.map((e) => {
    const stageItems = checklists.filter((c) => c.entry_id === e.id && c.stage_name === e.current_stage);
    return { ...e, checklist_total: stageItems.length, checklist_done: stageItems.filter((c) => c.is_checked).length };
  });

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
        {ONBOARDING_PIPELINE_STAGES.map((stage) => {
          const stageEntries = enrichedEntries.filter((e) => e.current_stage === stage);
          const isOver = draggingOver === stage;

          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => handleDragEnter(stage)}
              onDragLeave={() => handleDragLeave(stage)}
              onDrop={() => handleDrop(stage)}
              className={`flex-shrink-0 w-60 flex flex-col rounded-xl border-t-2 ${ONBOARDING_STAGE_COLORS[stage]} bg-dark-800/40 transition-all ${isOver ? 'border-2 border-dashed border-white/20 bg-dark-700/40 scale-[1.01]' : 'border border-white/5'}`}
            >
              <div className="px-3 py-2.5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ONBOARDING_STAGE_HEADER_COLORS[stage]}`}>{stage}</span>
                  <span className="text-xs text-gray-500">{stageEntries.length}</span>
                </div>
              </div>

              <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                {stageEntries.map((entry) => (
                  <OnboardingCard
                    key={entry.id}
                    entry={entry}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedEntry(entries.find((e) => e.id === entry.id) || null)}
                  />
                ))}
              </div>

              <div className="p-2 pt-0">
                <button onClick={() => setEditEntry({ current_stage: stage })} className="w-full py-1.5 rounded-lg border border-dashed border-white/10 text-xs text-gray-500 hover:text-gray-300 hover:border-white/20 flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Add Client
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedEntry && (
        <OnboardingEntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={() => { setEditEntry(selectedEntry); setSelectedEntry(null); }}
          onRefresh={onRefresh}
        />
      )}

      {editEntry !== null && (
        <OnboardingEntryFormModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={() => { setEditEntry(null); onRefresh(); }}
        />
      )}
    </>
  );
}
