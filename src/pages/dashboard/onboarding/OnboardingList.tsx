import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Pencil, ChevronDown, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../lib/format';
import {
  ONBOARDING_TYPES, ONBOARDING_STATUSES, ONBOARDING_STATUS_COLORS,
  ONBOARDING_TYPE_COLORS, PRIORITY_COLORS, getInitials, getAvatarColor,
} from '../../../lib/onboarding/constants';
import type { Onboarding, OnboardingChecklist } from '../../../lib/onboarding/types';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function OnboardingList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Onboarding[]>([]);
  const [checklists, setChecklists] = useState<Record<string, { total: number; done: number }>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const load = async () => {
    if (!user) return;
    const [obRes, clRes] = await Promise.all([
      supabase.from('onboardings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('onboarding_checklist').select('onboarding_id, is_checked').eq('user_id', user.id),
    ]);
    setItems((obRes.data || []) as Onboarding[]);

    const map: Record<string, { total: number; done: number }> = {};
    for (const c of (clRes.data || []) as Pick<OnboardingChecklist, 'onboarding_id' | 'is_checked'>[]) {
      if (!map[c.onboarding_id]) map[c.onboarding_id] = { total: 0, done: 0 };
      map[c.onboarding_id].total++;
      if (c.is_checked) map[c.onboarding_id].done++;
    }
    setChecklists(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('onboarding_activities').delete().eq('onboarding_id', deleteId);
    await supabase.from('onboarding_documents').delete().eq('onboarding_id', deleteId);
    await supabase.from('onboarding_checklist').delete().eq('onboarding_id', deleteId);
    await supabase.from('onboardings').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Onboarding deleted');
    load();
  };

  const summary = useMemo(() => {
    const active = items.filter((i) => i.status === 'In Progress').length;
    const completed = items.filter((i) => i.status === 'Completed').length;
    const overdue = items.filter((i) => {
      if (i.status === 'Completed' || i.status === 'Cancelled') return false;
      return i.expected_end_date && new Date(i.expected_end_date) < new Date();
    }).length;
    return { total: items.length, active, completed, overdue };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.full_name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || i.role.toLowerCase().includes(q));
    }
    if (filterStatus !== 'All') list = list.filter((i) => i.status === filterStatus);
    if (filterType !== 'All') list = list.filter((i) => i.onboarding_type === filterType);
    return list;
  }, [items, search, filterStatus, filterType]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} total onboardings</p>
        </div>
        <button onClick={() => navigate('/dashboard/onboarding/new')} className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Onboarding
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-xl font-bold">{summary.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3 h-3 text-blue-400" /><p className="text-xs text-gray-500">Active</p></div>
          <p className="text-xl font-bold text-blue-400">{summary.active}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1"><CheckCircle2 className="w-3 h-3 text-green-400" /><p className="text-xs text-gray-500">Completed</p></div>
          <p className="text-xl font-bold text-green-400">{summary.completed}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1"><AlertCircle className="w-3 h-3 text-red-400" /><p className="text-xs text-gray-500">Overdue</p></div>
          <p className="text-xl font-bold text-red-400">{summary.overdue}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, role..." className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Status</option>
              {ONBOARDING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Types</option>
              {ONBOARDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">No onboardings found</h3>
          <p className="text-sm text-gray-500 mb-6">Start your first onboarding to track progress.</p>
          <button onClick={() => navigate('/dashboard/onboarding/new')} className="px-6 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm">New Onboarding</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ob) => {
            const cl = checklists[ob.id] || { total: 0, done: 0 };
            const pct = cl.total > 0 ? Math.round((cl.done / cl.total) * 100) : 0;
            const isOverdue = ob.expected_end_date && new Date(ob.expected_end_date) < new Date() && ob.status !== 'Completed' && ob.status !== 'Cancelled';

            return (
              <div key={ob.id} className="glass-card glass-card-hover rounded-xl p-5 flex flex-col cursor-pointer transition-all" onClick={() => navigate(`/dashboard/onboarding/${ob.id}`)}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(ob.full_name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {getInitials(ob.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{ob.full_name}</p>
                    <p className="text-sm text-gray-400 truncate">{ob.role}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] rounded-md border ${ONBOARDING_TYPE_COLORS[ob.onboarding_type] || ''}`}>{ob.onboarding_type}</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-md border ${ONBOARDING_STATUS_COLORS[ob.status] || ''}`}>{ob.status}</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-md border ${PRIORITY_COLORS[ob.priority] || ''}`}>{ob.priority}</span>
                    </div>
                  </div>
                </div>

                {cl.total > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{cl.done}/{cl.total} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-1 mb-3 flex-1">
                  {ob.email && <p className="truncate">{ob.email}</p>}
                  <p>Start: {formatDate(ob.start_date)}</p>
                  {ob.expected_end_date && (
                    <p className={isOverdue ? 'text-red-400 font-medium' : ''}>
                      {isOverdue ? 'Overdue: ' : 'Expected: '}{formatDate(ob.expected_end_date)}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-600">Created {formatDate(ob.created_at)}</p>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/dashboard/onboarding/${ob.id}/edit`)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(ob.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Onboarding" message="This will permanently delete this onboarding and all related data. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
