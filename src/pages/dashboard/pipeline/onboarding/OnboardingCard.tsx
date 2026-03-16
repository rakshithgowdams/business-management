import { Calendar, Mail } from 'lucide-react';
import { formatDate } from '../../../../lib/format';
import { ONBOARDING_STAGE_HEADER_COLORS } from '../../../../lib/pipeline/constants';
import type { OnboardingPipelineEntry } from '../../../../lib/pipeline/types';

interface Props {
  entry: OnboardingPipelineEntry & { checklist_total?: number; checklist_done?: number };
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

export default function OnboardingCard({ entry, onDragStart, onDragEnd, onClick }: Props) {
  const total = entry.checklist_total || 0;
  const done = entry.checklist_done || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const daysInStage = Math.floor((Date.now() - new Date(entry.stage_entered_at).getTime()) / 86400000);
  const isStale = daysInStage > 7;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(entry.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="bg-dark-900/80 border border-white/5 rounded-xl p-3 cursor-pointer hover:border-white/10 hover:bg-dark-900 active:opacity-70 select-none transition-all group"
    >
      <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{entry.client_name}</p>

      {entry.client_email && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Mail className="w-3 h-3 text-gray-600 shrink-0" />
          <p className="text-xs text-gray-500 truncate">{entry.client_email}</p>
        </div>
      )}

      {total > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Stage checklist</span>
            <span className="text-[10px] text-gray-400">{done}/{total}</span>
          </div>
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <span className={`text-[10px] ${isStale ? 'text-amber-400' : 'text-gray-600'}`}>
          {daysInStage === 0 ? 'Today' : `${daysInStage}d in stage`}
        </span>
        {entry.target_go_live_date && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{new Date(entry.target_go_live_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
