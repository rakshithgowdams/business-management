import { useNavigate } from 'react-router-dom';
import { GitBranch, ArrowRight, TrendingUp, DollarSign, Target, Zap } from 'lucide-react';
import { formatINR } from '../../../lib/format';

interface DealStage {
  count: number;
  value: number;
}

interface PipelineStats {
  stages: Record<string, DealStage>;
  totalDeals: number;
  totalValue: number;
  wonValue: number;
  wonCount: number;
  lostCount: number;
  avgDealValue: number;
  winRate: number;
  hotDeals: { id: string; title: string; company_name: string; deal_value: number; stage: string; probability: number }[];
}

const STAGE_ORDER = ['lead', 'prospect', 'proposal', 'negotiation', 'won', 'lost'];
const STAGE_COLORS: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  lead:        { bar: 'bg-gray-500',    text: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/20' },
  prospect:    { bar: 'bg-blue-500',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  proposal:    { bar: 'bg-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  negotiation: { bar: 'bg-orange-500',  text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
  won:         { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  lost:        { bar: 'bg-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
};

export default function PipelineWidget({ data }: { data: PipelineStats }) {
  const nav = useNavigate();

  const activeStages = STAGE_ORDER.filter(s => s !== 'won' && s !== 'lost');
  const activeTotal = activeStages.reduce((sum, s) => sum + (data.stages[s]?.count || 0), 0);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Sales Pipeline</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/pipeline')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View Pipeline <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
          <Zap className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
          <p className="text-base font-bold text-cyan-400">{data.totalDeals}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total Deals</p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
          <Target className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
          <p className="text-base font-bold text-emerald-400">{data.winRate.toFixed(0)}%</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Win Rate</p>
        </div>
        <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/10 text-center">
          <TrendingUp className="w-3.5 h-3.5 text-teal-400 mx-auto mb-1" />
          <p className="text-base font-bold text-teal-400">{data.wonCount}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Won</p>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] text-gray-500">Pipeline Value</p>
            <p className="text-xs font-bold text-white">{formatINR(data.totalValue)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500">Revenue Won</p>
          <p className="text-xs font-bold text-emerald-400">{formatINR(data.wonValue)}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Stage Breakdown</p>
        <div className="space-y-1.5">
          {activeStages.map(stage => {
            const stageData = data.stages[stage] || { count: 0, value: 0 };
            const colors = STAGE_COLORS[stage] || STAGE_COLORS.lead;
            const pct = activeTotal > 0 ? (stageData.count / activeTotal) * 100 : 0;
            return (
              <div key={stage} className="flex items-center gap-2">
                <div className="w-16 text-[10px] text-gray-500 capitalize shrink-0">{stage}</div>
                <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-semibold ${colors.text}`}>{stageData.count}</span>
                  <span className="text-[10px] text-gray-600">{formatINR(stageData.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.hotDeals.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Hot Deals</p>
          <div className="space-y-1.5">
            {data.hotDeals.slice(0, 3).map(deal => {
              const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS.lead;
              return (
                <div key={deal.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">{deal.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{deal.company_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium capitalize ${colors.bg} ${colors.text} ${colors.border}`}>
                      {deal.stage}
                    </span>
                    <span className="text-[10px] font-semibold text-white">{formatINR(deal.deal_value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
