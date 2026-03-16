import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, CreditCard, TrendingUp, BarChart2, Calendar, Tag } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, daysRemaining } from '../../lib/format';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';

const CATEGORIES = ['AI Tools', 'Marketing', 'Design', 'Development', 'Communication', 'Finance', 'Storage', 'Other'];
const CYCLES = ['Monthly', 'Yearly', 'Weekly'];
const STATUSES = ['Active', 'Paused', 'Cancelled'];
const SUGGESTIONS = [
  'n8n', 'Kling AI', 'Claude AI', 'ChatGPT', 'Canva', 'Adobe Creative Cloud',
  'Figma', 'Notion', 'Slack', 'GitHub', 'Vercel', 'AWS', 'Google Workspace',
  'Zoom', 'Linear', 'Framer', 'Webflow', 'Ahrefs', 'Semrush', 'Grammarly',
  'Dropbox', 'Monday.com', 'Loom', 'Intercom', 'HubSpot', 'Mailchimp',
];

const CATEGORY_COLORS: Record<string, string> = {
  'AI Tools': '#3B82F6', 'Marketing': '#F59E0B', 'Design': '#EC4899',
  'Development': '#22C55E', 'Communication': '#06B6D4', 'Finance': '#FF6B00',
  'Storage': '#8B5CF6', 'Other': '#6B7280',
};

interface Subscription {
  id: string;
  service_name: string;
  category: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: string;
  payment_method: string;
  status: string;
  notes: string;
}

type ViewMode = 'list' | 'analytics';

const inputCls = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label || payload[0]?.name}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.fill }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' ? formatCurrency(p.value, 'INR') : p.value}
        </p>
      ))}
    </div>
  );
};

function toMonthly(sub: Subscription): number {
  const amt = sub.amount;
  if (sub.billing_cycle === 'Yearly') return amt / 12;
  if (sub.billing_cycle === 'Weekly') return amt * 4.33;
  return amt;
}

export default function Subscriptions() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    service_name: '', category: CATEGORIES[0], amount: '', currency: 'INR',
    billing_cycle: CYCLES[0], next_billing_date: '', payment_method: '', status: 'Active', notes: '',
  });

  useEffect(() => {
    if (user) loadSubs();
  }, [user]);

  const loadSubs = async () => {
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setSubs((data || []).map((d) => ({ ...d, amount: Number(d.amount) })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_name || !form.amount) { toast.error('Name and amount are required'); return; }
    if (editing) {
      const { error } = await supabase.from('subscriptions').update({ ...form, amount: Number(form.amount) }).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Subscription updated');
    } else {
      const { error } = await supabase.from('subscriptions').insert({ ...form, amount: Number(form.amount), user_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success('Subscription added');
    }
    resetForm();
    loadSubs();
  };

  const handleEdit = (sub: Subscription) => {
    setEditing(sub);
    setForm({
      service_name: sub.service_name, category: sub.category, amount: String(sub.amount),
      currency: sub.currency, billing_cycle: sub.billing_cycle,
      next_billing_date: sub.next_billing_date || '', payment_method: sub.payment_method,
      status: sub.status, notes: sub.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('subscriptions').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Subscription deleted');
    loadSubs();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ service_name: '', category: CATEGORIES[0], amount: '', currency: 'INR', billing_cycle: CYCLES[0], next_billing_date: '', payment_method: '', status: 'Active', notes: '' });
  };

  const toggleStatus = async (sub: Subscription) => {
    const next = sub.status === 'Active' ? 'Paused' : 'Active';
    await supabase.from('subscriptions').update({ status: next }).eq('id', sub.id);
    toast.success(`Subscription ${next === 'Active' ? 'activated' : 'paused'}`);
    loadSubs();
  };

  const activeSubs = subs.filter((s) => s.status === 'Active');
  const monthlyTotal = activeSubs.reduce((sum, s) => sum + toMonthly(s), 0);
  const yearlyTotal = monthlyTotal * 12;

  const upcoming = activeSubs
    .filter((s) => s.next_billing_date && daysRemaining(s.next_billing_date) <= 7 && daysRemaining(s.next_billing_date) >= 0)
    .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date));

  const statusColor = (s: string) => {
    if (s === 'Active') return 'bg-green-500/10 text-green-400 border border-green-500/20';
    if (s === 'Paused') return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    return 'bg-red-500/10 text-red-400 border border-red-500/20';
  };

  const filteredSubs = subs.filter(s => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const categorySpend = CATEGORIES.map(cat => ({
    name: cat,
    monthly: activeSubs.filter(s => s.category === cat).reduce((sum, s) => sum + toMonthly(s), 0),
  })).filter(c => c.monthly > 0).sort((a, b) => b.monthly - a.monthly);

  const pieData = categorySpend.map(c => ({ name: c.name, value: Math.round(c.monthly) }));

  const cycleData = [
    { name: 'Monthly', count: activeSubs.filter(s => s.billing_cycle === 'Monthly').length, spend: activeSubs.filter(s => s.billing_cycle === 'Monthly').reduce((s, x) => s + x.amount, 0) },
    { name: 'Yearly', count: activeSubs.filter(s => s.billing_cycle === 'Yearly').length, spend: activeSubs.filter(s => s.billing_cycle === 'Yearly').reduce((s, x) => s + x.amount / 12, 0) },
    { name: 'Weekly', count: activeSubs.filter(s => s.billing_cycle === 'Weekly').length, spend: activeSubs.filter(s => s.billing_cycle === 'Weekly').reduce((s, x) => s + x.amount * 4.33, 0) },
  ].filter(c => c.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 overflow-hidden text-sm">
            {(['list', 'analytics'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-2 capitalize transition-colors ${viewMode === v ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-semibold rounded-xl gradient-orange text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Subscription
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-brand-400" />
            <p className="text-sm text-gray-400">Monthly Spend</p>
          </div>
          <p className="text-2xl font-bold text-brand-400">{formatCurrency(monthlyTotal, 'INR')}</p>
          <p className="text-xs text-gray-500 mt-1">{activeSubs.length} active subs</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Yearly Spend</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(yearlyTotal, 'INR')}</p>
          <p className="text-xs text-gray-500 mt-1">Estimated annual cost</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <p className="text-sm text-gray-400">Renewing Soon</p>
          </div>
          <p className="text-2xl font-bold text-orange-400">{upcoming.length}</p>
          <p className="text-xs text-gray-500 mt-1">Within 7 days</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-400">Total Tracked</p>
          </div>
          <p className="text-2xl font-bold text-white">{subs.length}</p>
          <p className="text-xs text-gray-500 mt-1">{subs.filter(s => s.status === 'Paused').length} paused, {subs.filter(s => s.status === 'Cancelled').length} cancelled</p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-orange-500/20 bg-orange-500/5">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Upcoming Renewals</p>
          <div className="space-y-2">
            {upcoming.map((s) => {
              const days = daysRemaining(s.next_billing_date);
              return (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="flex-1">
                    <strong>{s.service_name}</strong>
                    {' renews on '}{formatDate(s.next_billing_date)}
                  </span>
                  <span className="text-orange-400 font-semibold">{formatCurrency(s.amount, s.currency)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${days === 0 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {days === 0 ? 'Today!' : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {activeSubs.length === 0 ? (
            <EmptyState title="No active subscriptions" description="Add subscriptions to view analytics." />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Monthly Spend by Category</h3>
                  {pieData.length === 0 ? (
                    <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#6B7280'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(v, 'INR')} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Spend per Category (Monthly)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categorySpend} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={60} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="monthly" name="Monthly" radius={[0, 4, 4, 0]}>
                        {categorySpend.map((entry, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#6B7280'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-4">Subscription Breakdown by Cycle</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {cycleData.map(c => (
                    <div key={c.name} className="bg-dark-800 rounded-xl p-4 border border-white/5">
                      <p className="text-xs text-gray-500 mb-1">{c.name} Billing</p>
                      <p className="text-xl font-bold text-white">{c.count} <span className="text-sm text-gray-400">subs</span></p>
                      <p className="text-sm text-brand-400 font-medium mt-1">{formatCurrency(c.spend, 'INR')}/mo</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-sm font-semibold">Top Subscriptions by Cost</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-white/5">
                        <th className="px-4 py-3 font-medium">Service</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium text-right">Monthly Equiv.</th>
                        <th className="px-4 py-3 font-medium text-right">Annual Cost</th>
                        <th className="px-4 py-3 font-medium text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSubs
                        .sort((a, b) => toMonthly(b) - toMonthly(a))
                        .map((s) => {
                          const monthly = toMonthly(s);
                          const share = monthlyTotal > 0 ? (monthly / monthlyTotal) * 100 : 0;
                          return (
                            <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                              <td className="px-4 py-3 font-medium">{s.service_name}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${CATEGORY_COLORS[s.category] || '#6B7280'}22`, color: CATEGORY_COLORS[s.category] || '#6B7280' }}>
                                  {s.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">{formatCurrency(monthly, 'INR')}</td>
                              <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(monthly * 12, 'INR')}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${share}%`, background: CATEGORY_COLORS[s.category] || '#6B7280' }} />
                                  </div>
                                  <span className="text-xs text-gray-400">{share.toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-dark-800 border border-white/10 rounded-lg px-2 py-1.5 text-gray-300"
              >
                <option value="all">All</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-dark-800 border border-white/10 rounded-lg px-2 py-1.5 text-gray-300"
              >
                <option value="all">All</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); }}
                className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded-lg border border-white/5 hover:bg-white/5"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredSubs.length === 0 ? (
            <EmptyState title="No subscriptions" description="Add your first subscription to start tracking recurring costs." />
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/5">
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Cycle</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Next Billing</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">Monthly</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map((sub) => {
                      const days = sub.next_billing_date ? daysRemaining(sub.next_billing_date) : null;
                      const isDueSoon = days !== null && days <= 7 && days >= 0 && sub.status === 'Active';
                      return (
                        <tr key={sub.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${isDueSoon ? 'bg-orange-500/[0.03]' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isDueSoon && <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                              <span className="font-medium">{sub.service_name}</span>
                            </div>
                            {sub.payment_method && <p className="text-xs text-gray-500 mt-0.5">{sub.payment_method}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${CATEGORY_COLORS[sub.category] || '#6B7280'}20`, color: CATEGORY_COLORS[sub.category] || '#6B7280' }}>
                              {sub.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{sub.billing_cycle}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor(sub.status)}`}>{sub.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {sub.next_billing_date ? (
                              <div>
                                <span className={isDueSoon ? 'text-orange-400 font-medium' : 'text-gray-400'}>{formatDate(sub.next_billing_date)}</span>
                                {days !== null && days >= 0 && days <= 30 && (
                                  <p className="text-xs text-gray-500 mt-0.5">{days === 0 ? 'Today' : `in ${days}d`}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(sub.amount, sub.currency)}</td>
                          <td className="px-4 py-3 text-right text-gray-400 text-xs">{formatCurrency(toMonthly(sub), 'INR')}/mo</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => toggleStatus(sub)}
                                className={`px-2 py-1 text-xs rounded-lg border font-medium transition-colors ${
                                  sub.status === 'Active'
                                    ? 'border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10'
                                    : 'border-green-500/20 text-green-400 hover:bg-green-500/10'
                                }`}
                              >
                                {sub.status === 'Active' ? 'Pause' : 'Activate'}
                              </button>
                              <button onClick={() => handleEdit(sub)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setDeleteId(sub.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 bg-white/[0.02] text-sm">
                      <td colSpan={5} className="px-4 py-3 text-gray-500 font-medium">{filteredSubs.length} subscriptions</td>
                      <td colSpan={2} className="px-4 py-3 text-right font-bold text-brand-400">
                        {formatCurrency(filteredSubs.filter(s => s.status === 'Active').reduce((s, sub) => s + toMonthly(sub), 0), 'INR')}/mo
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Subscription' : 'Add Subscription'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Service Name *</label>
                <input type="text" value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} className={inputCls} placeholder="e.g. ChatGPT Plus" list="suggestions" />
                <datalist id="suggestions">{SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Amount *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Billing Cycle</label>
                  <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })} className={inputCls}>
                    {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Next Billing Date</label>
                <input type="date" value={form.next_billing_date} onChange={(e) => setForm({ ...form, next_billing_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Payment Method</label>
                <input type="text" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={inputCls} placeholder="e.g. Credit Card" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">
                {editing ? 'Update Subscription' : 'Add Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Subscription" message="Are you sure you want to delete this subscription?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
