import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { PROJECT_PIPELINE_STAGES, PROJECT_STAGE_COLORS, PROJECT_STAGE_HEADER_COLORS } from '../../../../lib/pipeline/constants';
import type { ProjectPipelineEntry, ProjectPipelineDependency } from '../../../../lib/pipeline/types';
import { formatINR } from '../../../../lib/format';
import ProjectPipelineCard from './ProjectPipelineCard';
import ProjectPipelineEntryDetailModal from './ProjectPipelineEntryDetailModal';
import ProjectPipelineEntryFormModal from './ProjectPipelineEntryFormModal';

interface Props {
  entries: ProjectPipelineEntry[];
  dependencies: ProjectPipelineDependency[];
  onRefresh: () => void;
}

export default function ProjectKanbanBoard({ entries, dependencies, onRefresh }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragCounters = useRef<Record<string, number>>({});
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ProjectPipelineEntry | null>(null);
  const [editEntry, setEditEntry] = useState<Partial<ProjectPipelineEntry> | null>(null);

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnd = () => { setDraggedId(null); setDraggingOver(null); };
  const handleDragEnter = (stage: string) => { dragCounters.current[stage] = (dragCounters.current[stage] || 0) + 1; setDraggingOver(stage); };
  const handleDragLeave = (stage: string) => { dragCounters.current[stage] = (dragCounters.current[stage] || 0) - 1; if (dragCounters.current[stage] <= 0) { dragCounters.current[stage] = 0; setDraggingOver(null); } };
  const handleDrop = async (stage: string) => {
    dragCounters.current[stage] = 0;
    setDraggingOver(null);
    if (!draggedId) return;
    const current = entries.find((e) => e.id === draggedId);
    if (!current || current.stage === stage) return;
    await supabase.from('project_pipeline_entries').update({ stage, updated_at: new Date().toISOString() }).eq('id', draggedId);
    onRefresh();
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
        {PROJECT_PIPELINE_STAGES.map((stage) => {
          const stageEntries = entries.filter((e) => e.stage === stage);
          const stageValue = stageEntries.reduce((s, e) => s + e.budget, 0);
          const isOver = draggingOver === stage;

          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => handleDragEnter(stage)}
              onDragLeave={() => handleDragLeave(stage)}
              onDrop={() => handleDrop(stage)}
              className={`flex-shrink-0 w-60 flex flex-col rounded-xl border-t-2 ${PROJECT_STAGE_COLORS[stage]} bg-dark-800/40 transition-all ${isOver ? 'border-2 border-dashed border-white/20 bg-dark-700/40 scale-[1.01]' : 'border border-white/5'}`}
            >
              <div className="px-3 py-2.5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PROJECT_STAGE_HEADER_COLORS[stage]}`}>{stage}</span>
                  <span className="text-xs text-gray-500">{stageEntries.length}</span>
                </div>
                {stageValue > 0 && <p className="text-[10px] text-gray-500 mt-1">{formatINR(stageValue)}</p>}
              </div>

              <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                {stageEntries.map((entry) => (
                  <ProjectPipelineCard
                    key={entry.id}
                    entry={entry}
                    hasDependencies={dependencies.some((d) => d.entry_id === entry.id)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedEntry(entry)}
                  />
                ))}
              </div>

              <div className="p-2 pt-0">
                <button onClick={() => setEditEntry({ stage, priority: 'Medium', budget: 0 })} className="w-full py-1.5 rounded-lg border border-dashed border-white/10 text-xs text-gray-500 hover:text-gray-300 hover:border-white/20 flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Add Project
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedEntry && (
        <ProjectPipelineEntryDetailModal
          entry={selectedEntry}
          allEntries={entries}
          onClose={() => setSelectedEntry(null)}
          onEdit={() => { setEditEntry(selectedEntry); setSelectedEntry(null); }}
          onRefresh={onRefresh}
        />
      )}

      {editEntry !== null && (
        <ProjectPipelineEntryFormModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={() => { setEditEntry(null); onRefresh(); }}
        />
      )}
    </>
  );
}
