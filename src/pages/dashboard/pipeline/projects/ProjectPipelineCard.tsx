import { Calendar, Building2, Link2, AlertCircle } from 'lucide-react';
import { formatINR } from '../../../../lib/format';
import { DEAL_PRIORITY_COLORS } from '../../../../lib/pipeline/constants';
import type { ProjectPipelineEntry } from '../../../../lib/pipeline/types';

interface Props {
  entry: ProjectPipelineEntry;
  hasDependencies: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

export default function ProjectPipelineCard({ entry, hasDependencies, onDragStart, onDragEnd, onClick }: Props) {
  const total = entry.milestone_count || 0;
  const done = entry.milestone_done || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isOverdue = entry.target_end_date && new Date(entry.target_end_date) < new Date() && entry.stage !== 'Done';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(entry.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="bg-dark-900/80 border border-white/5 rounded-xl p-3 cursor-pointer hover:border-white/10 hover:bg-dark-900 active:opacity-70 select-none transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white leading-tight group-hover:text-brand-300 transition-colors">{entry.title}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${DEAL_PRIORITY_COLORS[entry.priority]}`}>{entry.priority}</span>
      </div>

      {entry.client_name && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <Building2 className="w-3 h-3 text-gray-600 shrink-0" />
          <p className="text-xs text-gray-400 truncate">{entry.client_name}</p>
        </div>
      )}

      {entry.budget > 0 && <p className="text-xs font-semibold text-white mb-2">{formatINR(entry.budget)}</p>}

      {total > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Milestones</span>
            <span className="text-[10px] text-gray-400">{done}/{total}</span>
          </div>
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        {entry.target_end_date ? (
          <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
            <Calendar className="w-3 h-3" />
            <span>{new Date(entry.target_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{isOverdue ? ' — Overdue' : ''}</span>
          </div>
        ) : <div />}
        <div className="flex items-center gap-1">
          {hasDependencies && <Link2 className="w-3 h-3 text-amber-400" />}
          {entry.tags && (
            <span className="text-[10px] text-gray-600 bg-dark-700 px-1.5 py-0.5 rounded">{entry.tags.split(',')[0]?.trim()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
