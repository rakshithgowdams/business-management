import { Building2, Calendar, TrendingUp } from 'lucide-react';
import { formatINR } from '../../../../lib/format';
import { DEAL_PRIORITY_COLORS } from '../../../../lib/pipeline/constants';
import type { PipelineDeal } from '../../../../lib/pipeline/types';

interface Props {
  deal: PipelineDeal;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

export default function DealCard({ deal, onDragStart, onDragEnd, onClick }: Props) {
  const isOverdue = deal.expected_close_date && new Date(deal.expected_close_date) < new Date() && deal.stage !== 'Won' && deal.stage !== 'Lost';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(deal.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="bg-dark-900/80 border border-white/5 rounded-xl p-3 cursor-pointer hover:border-white/10 hover:bg-dark-900 active:opacity-70 select-none transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white leading-tight group-hover:text-brand-300 transition-colors">{deal.title}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${DEAL_PRIORITY_COLORS[deal.priority]}`}>{deal.priority}</span>
      </div>

      {deal.company_name && (
        <div className="flex items-center gap-1.5 mb-1">
          <Building2 className="w-3 h-3 text-gray-600 shrink-0" />
          <p className="text-xs text-gray-400 truncate">{deal.company_name}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-sm font-semibold text-white">{formatINR(deal.deal_value)}</span>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-400">{deal.probability}%</span>
        </div>
      </div>

      {deal.expected_close_date && (
        <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
          <Calendar className="w-3 h-3" />
          <span>{new Date(deal.expected_close_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{isOverdue ? ' — Overdue' : ''}</span>
        </div>
      )}

      {deal.source && (
        <div className="mt-2">
          <span className="text-[10px] text-gray-600 bg-dark-700 px-1.5 py-0.5 rounded">{deal.source}</span>
        </div>
      )}
    </div>
  );
}
