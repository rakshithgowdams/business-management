import { useEffect, useState } from 'react';
import { Plus, TrendingUp, CheckCircle, XCircle, BarChart2, Search } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import { DEAL_STAGES, DEAL_PRIORITIES } from '../../../../lib/pipeline/constants';
import type { PipelineDeal } from '../../../../lib/pipeline/types';
import SalesKanbanBoard from './SalesKanbanBoard';
import DealFormModal from './DealFormModal';

export default function SalesCRMBoard() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('pipeline_deals').select('*').eq('user_id', user.id).order('sort_order').order('created_at', { ascending: false });
    setDeals(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = deals.filter((d) => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStage !== 'All' && d.stage !== filterStage) return false;
    if (filterPriority !== 'All' && d.priority !== filterPriority) return false;
    return true;
  });

  const activeDeals = deals.filter((d) => !['Won', 'Lost'].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === 'Won');
  const lostDeals = deals.filter((d) => d.stage === 'Lost');
  const totalPipeline = activeDeals.reduce((s, d) => s + d.deal_value * (d.probability / 100), 0);
  const wonValue = wonDeals.reduce((s, d) => s + d.deal_value, 0);
  const winRate = (wonDeals.length + lostDeals.length) > 0 ? ((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100).toFixed(1) : '0';
  const avgDealSize = wonDeals.length > 0 ? wonDeals.reduce((s, d) => s + d.deal_value, 0) / wonDeals.length : 0;

  const lostByReason = lostDeals.reduce<Record<string, number>>((acc, d) => {
    const r = d.lost_reason || 'Unknown';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-brand-400" /><p className="text-xs text-gray-400">Weighted Pipeline</p></div>
          <p className="text-lg font-bold text-white">{formatINR(totalPipeline)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{activeDeals.length} active deals</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-emerald-400" /><p className="text-xs text-gray-400">Won Revenue</p></div>
          <p className="text-lg font-bold text-emerald-400">{formatINR(wonValue)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{wonDeals.length} deals won</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><BarChart2 className="w-4 h-4 text-blue-400" /><p className="text-xs text-gray-400">Win Rate</p></div>
          <p className="text-lg font-bold text-white">{winRate}%</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{lostDeals.length} lost</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-cyan-400" /><p className="text-xs text-gray-400">Avg Deal Size</p></div>
          <p className="text-lg font-bold text-white">{formatINR(avgDealSize)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{deals.length} total deals</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deals..." className="w-full pl-8 pr-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500" />
        </div>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none">
          <option value="All">All Stages</option>
          {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none">
          <option value="All">All Priorities</option>
          {DEAL_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => setShowAnalysis((v) => !v)} className={`px-3 py-2 rounded-xl border text-sm transition-all ${showAnalysis ? 'border-brand-500/40 text-brand-400 bg-brand-600/10' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}>
          Win/Loss Analysis
        </button>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 gradient-orange text-white text-sm font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      {showAnalysis && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Win/Loss Analysis</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Win Rate</p>
              <p className="text-xl font-bold text-emerald-400">{winRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Avg Won Deal</p>
              <p className="text-xl font-bold text-white">{formatINR(avgDealSize)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Avg Lost Deal</p>
              <p className="text-xl font-bold text-white">{formatINR(lostDeals.length > 0 ? lostDeals.reduce((s, d) => s + d.deal_value, 0) / lostDeals.length : 0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Evaluated</p>
              <p className="text-xl font-bold text-white">{wonDeals.length + lostDeals.length}</p>
            </div>
          </div>
          {Object.keys(lostByReason).length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-3">Loss Reasons</p>
              <div className="space-y-2">
                {Object.entries(lostByReason).sort(([, a], [, b]) => b - a).map(([reason, count]) => {
                  const pct = (count / lostDeals.length) * 100;
                  return (
                    <div key={reason} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-32 shrink-0">{reason}</span>
                      <div className="flex-1 bg-dark-700 rounded-full h-2">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <SalesKanbanBoard deals={filtered} onRefresh={load} />

      {showForm && <DealFormModal deal={{}} onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}
