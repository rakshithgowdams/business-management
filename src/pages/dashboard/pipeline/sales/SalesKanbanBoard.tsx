import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { formatINR } from '../../../../lib/format';
import { DEAL_STAGES, DEAL_STAGE_COLORS, DEAL_STAGE_HEADER_COLORS } from '../../../../lib/pipeline/constants';
import type { PipelineDeal } from '../../../../lib/pipeline/types';
import DealCard from './DealCard';
import DealDetailModal from './DealDetailModal';
import DealFormModal from './DealFormModal';

interface Props {
  deals: PipelineDeal[];
  onRefresh: () => void;
}

export default function SalesKanbanBoard({ deals, onRefresh }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragCounters = useRef<Record<string, number>>({});
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);
  const [editDeal, setEditDeal] = useState<Partial<PipelineDeal> | null>(null);

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnd = () => { setDraggedId(null); setDraggingOver(null); };

  const handleDragEnter = (stage: string) => {
    dragCounters.current[stage] = (dragCounters.current[stage] || 0) + 1;
    setDraggingOver(stage);
  };
  const handleDragLeave = (stage: string) => {
    dragCounters.current[stage] = (dragCounters.current[stage] || 0) - 1;
    if (dragCounters.current[stage] <= 0) { dragCounters.current[stage] = 0; setDraggingOver(null); }
  };
  const handleDrop = async (stage: string) => {
    dragCounters.current[stage] = 0;
    setDraggingOver(null);
    if (!draggedId) return;
    const currentDeal = deals.find((d) => d.id === draggedId);
    if (!currentDeal || currentDeal.stage === stage) return;
    await supabase.from('pipeline_deals').update({ stage, updated_at: new Date().toISOString() }).eq('id', draggedId);
    onRefresh();
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          const stageValue = stageDeals.reduce((s, d) => s + d.deal_value, 0);
          const isOver = draggingOver === stage;

          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => handleDragEnter(stage)}
              onDragLeave={() => handleDragLeave(stage)}
              onDrop={() => handleDrop(stage)}
              className={`flex-shrink-0 w-64 flex flex-col rounded-xl border-t-2 ${DEAL_STAGE_COLORS[stage]} bg-dark-800/40 transition-all ${isOver ? 'border-2 border-dashed border-white/20 bg-dark-700/40 scale-[1.01]' : 'border border-white/5'}`}
            >
              <div className="px-3 py-2.5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${DEAL_STAGE_HEADER_COLORS[stage]}`}>{stage}</span>
                  <span className="text-xs text-gray-500">{stageDeals.length}</span>
                </div>
                {stageValue > 0 && <p className="text-[10px] text-gray-500 mt-1">{formatINR(stageValue)}</p>}
              </div>

              <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedDeal(deal)}
                  />
                ))}
              </div>

              <div className="p-2 pt-0">
                <button
                  onClick={() => setEditDeal({ stage, title: '', company_name: '', priority: 'Medium', deal_value: 0, probability: 10 })}
                  className="w-full py-1.5 rounded-lg border border-dashed border-white/10 text-xs text-gray-500 hover:text-gray-300 hover:border-white/20 flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" /> Add Deal
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onEdit={() => { setEditDeal(selectedDeal); setSelectedDeal(null); }}
          onRefresh={onRefresh}
        />
      )}

      {editDeal !== null && (
        <DealFormModal
          deal={editDeal}
          onClose={() => setEditDeal(null)}
          onSaved={() => { setEditDeal(null); onRefresh(); }}
        />
      )}
    </>
  );
}
