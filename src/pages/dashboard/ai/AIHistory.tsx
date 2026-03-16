import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Eye, RefreshCw, Trash2, TrendingUp, Users, DollarSign, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../lib/format';
import { DEAL_POTENTIAL_COLORS } from '../../../lib/ai/constants';
import type { AIAnalysis } from '../../../lib/ai/types';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function AIHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDeal, setFilterDeal] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'deal'>('date');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    const { data } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setAnalyses((data || []) as AIAnalysis[]);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('ai_analyses').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Analysis deleted');
    load();
  };

  const filtered = useMemo(() => {
    let list = analyses;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.business_name.toLowerCase().includes(q) || a.business_type.toLowerCase().includes(q));
    }
    if (filterDeal !== 'All') list = list.filter((a) => a.deal_potential === filterDeal);
    if (sortBy === 'deal') {
      const order = { 'Very High': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      list = [...list].sort((a, b) => (order[a.deal_potential as keyof typeof order] ?? 4) - (order[b.deal_potential as keyof typeof order] ?? 4));
    }
    return list;
  }, [analyses, search, filterDeal, sortBy]);

  const stats = useMemo(() => ({
    total: analyses.length,
    highPotential: analyses.filter((a) => a.deal_potential === 'High' || a.deal_potential === 'Very High').length,
    topPain: analyses.length > 0 ? getMostCommon(analyses.flatMap((a) => {
      const result = a.analysis_result as { top_pain_points?: { pain: string }[] } | null;
      return result?.top_pain_points?.map((p: { pain: string }) => p.pain) || [];
    })) : 'N/A',
    topService: analyses.length > 0 ? getMostCommon(analyses.flatMap((a) => {
      const result = a.analysis_result as { service_recommendations?: { service: string }[] } | null;
      return result?.service_recommendations?.map((s: { service: string }) => s.service) || [];
    })) : 'N/A',
  }), [analyses]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/ai-intelligence')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold">Analysis History</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-brand-400" /><span className="text-xs text-gray-500">Total Analyzed</span></div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-400" /><span className="text-xs text-gray-500">High Potential</span></div>
          <p className="text-2xl font-bold text-green-400">{stats.highPotential}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-red-400" /><span className="text-xs text-gray-500">Top Pain Point</span></div>
          <p className="text-sm font-medium text-white truncate">{stats.topPain}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-blue-400" /><span className="text-xs text-gray-500">Top Service</span></div>
          <p className="text-sm font-medium text-white truncate">{stats.topService}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search businesses..." className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
        </div>
        <select value={filterDeal} onChange={(e) => setFilterDeal(e.target.value)} className="px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
          <option value="All">All Deals</option>
          <option value="Very High">Very High</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'deal')} className="px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
          <option value="date">Sort by Date</option>
          <option value="deal">Sort by Deal Score</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No analyses found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="glass-card rounded-xl p-4 hover:border-white/20 transition-colors flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-white truncate">{a.business_name}</p>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium border ${DEAL_POTENTIAL_COLORS[a.deal_potential] || ''}`}>{a.deal_potential}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{a.business_type}</span>
                  <span>{a.city}, {a.state}</span>
                  <span>{formatDate(a.created_at)}</span>
                  {a.estimated_deal_value && <span className="text-brand-400">{a.estimated_deal_value}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => navigate(`/dashboard/ai-intelligence?id=${a.id}`)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="View"><Eye className="w-4 h-4" /></button>
                <button onClick={() => navigate(`/dashboard/ai-intelligence?regenerate=${a.id}`)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-brand-400" title="Regenerate"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(a.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Analysis" message="This will permanently delete this analysis. This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function getMostCommon(arr: string[]): string {
  if (arr.length === 0) return 'N/A';
  const freq: Record<string, number> = {};
  for (const item of arr) {
    freq[item] = (freq[item] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
}
