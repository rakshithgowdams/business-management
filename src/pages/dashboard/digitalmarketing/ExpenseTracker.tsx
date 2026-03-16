import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR, formatDate } from '../../../lib/format';
import { CHANNELS, CHANNEL_LABELS, EXPENSE_TYPES } from '../../../lib/digitalMarketing/constants';
import type { DMExpense, Campaign } from '../../../lib/digitalMarketing/types';
import ConfirmDialog from '../../../components/ConfirmDialog';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const ta = `${ic} resize-none`;

const PAYMENT_METHODS = ['Bank Transfer', 'Credit Card', 'Debit Card', 'UPI', 'Cash', 'Wallet', 'Cheque'];
const EXPENSE_STATUSES = ['Pending', 'Paid', 'Approved', 'Rejected'];

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const blank = (): Partial<DMExpense> => ({
  date: new Date().toISOString().split('T')[0],
  platform: 'meta',
  expense_type: 'Ad Spend',
  amount: 0,
  currency: 'INR',
  description: '',
  invoice_url: '',
  payment_method: 'Bank Transfer',
  status: 'Paid',
  notes: '',
  campaign_id: '',
});

export default function ExpenseTracker() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<DMExpense[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Partial<DMExpense>>(blank());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const load = async () => {
    if (!user) return;
    const [{ data: exps }, { data: camps }] = await Promise.all([
      supabase.from('dm_expenses').select('*, campaign:dm_campaigns(name)').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('dm_campaigns').select('id, name, channel').eq('user_id', user.id),
    ]);
    setExpenses((exps || []) as DMExpense[]);
    setCampaigns(camps || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.date || !form.amount) { toast.error('Date and amount required'); return; }
    const payload = { ...form, user_id: user.id, campaign_id: form.campaign_id || null };
    const { error } = editId === 'new'
      ? await supabase.from('dm_expenses').insert(payload)
      : await supabase.from('dm_expenses').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Expense added' : 'Expense updated');
    setEditId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('dm_expenses').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Expense deleted');
    load();
  };

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const filtered = expenses.filter((e) => {
    if (filterPlatform !== 'All' && e.platform !== filterPlatform) return false;
    if (filterType !== 'All' && e.expense_type !== filterType) return false;
    return true;
  });

  const totalSpend = filtered.reduce((s, e) => s + e.amount, 0);

  const byPlatform = CHANNELS.reduce<Record<string, number>>((acc, ch) => {
    acc[ch] = expenses.filter((e) => e.platform === ch).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {});

  const topChannels = Object.entries(byPlatform)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxSpend = topChannels[0]?.[1] || 1;

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Marketing Expenses</h2>
          <p className="text-sm text-gray-500">{expenses.length} expense records</p>
        </div>
        <button onClick={() => { setForm(blank()); setEditId('new'); }} className="px-4 py-2.5 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 col-span-1">
          <p className="text-xs text-gray-400 mb-3">Spend by Channel</p>
          {topChannels.length === 0 ? (
            <p className="text-sm text-gray-500">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topChannels.map(([ch, val]) => (
                <div key={ch}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{CHANNEL_LABELS[ch] || ch}</span>
                    <span className="text-xs font-medium text-white">{formatINR(val)}</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(val / maxSpend) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Spend', value: formatINR(totalSpend), color: 'text-white' },
            { label: 'This Month', value: formatINR(expenses.filter((e) => e.date?.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + e.amount, 0)), color: 'text-blue-400' },
            { label: 'Pending', value: formatINR(expenses.filter((e) => e.status === 'Pending').reduce((s, e) => s + e.amount, 0)), color: 'text-yellow-400' },
            { label: 'Ad Spend', value: formatINR(expenses.filter((e) => e.expense_type === 'Ad Spend').reduce((s, e) => s + e.amount, 0)), color: 'text-emerald-400' },
            { label: 'Agency Fees', value: formatINR(expenses.filter((e) => e.expense_type === 'Agency Fee').reduce((s, e) => s + e.amount, 0)), color: 'text-cyan-400' },
            { label: 'Other Costs', value: formatINR(expenses.filter((e) => !['Ad Spend', 'Agency Fee'].includes(e.expense_type)).reduce((s, e) => s + e.amount, 0)), color: 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-3">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-base font-bold ${s.color} mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {editId && (
        <div className="glass-card rounded-xl p-5 border border-brand-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Expense Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Platform</label>
              <select value={form.platform || 'meta'} onChange={(e) => set('platform', e.target.value)} className={ic}>
                {CHANNELS.map((ch) => <option key={ch} value={ch}>{CHANNEL_LABELS[ch] || ch}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Expense Type</label>
              <select value={form.expense_type || 'Ad Spend'} onChange={(e) => set('expense_type', e.target.value)} className={ic}>
                {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Amount (₹) <span className="text-red-400">*</span></label>
              <input type="number" min={0} step="0.01" value={form.amount || 0} onChange={(e) => set('amount', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Payment Method</label>
              <select value={form.payment_method || 'Bank Transfer'} onChange={(e) => set('payment_method', e.target.value)} className={ic}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status || 'Paid'} onChange={(e) => set('status', e.target.value)} className={ic}>
                {EXPENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Campaign (optional)</label>
              <select value={form.campaign_id || ''} onChange={(e) => set('campaign_id', e.target.value)} className={ic}>
                <option value="">— None —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Invoice URL</label>
              <input type="text" value={form.invoice_url || ''} onChange={(e) => set('invoice_url', e.target.value)} className={ic} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Description</label>
              <input type="text" value={form.description || ''} onChange={(e) => set('description', e.target.value)} className={ic} placeholder="Short description" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
              <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} className={ta} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {['All', ...CHANNELS].map((ch) => (
            <button key={ch} onClick={() => setFilterPlatform(ch)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterPlatform === ch ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {ch === 'All' ? 'All Channels' : CHANNEL_LABELS[ch] || ch}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {['All', ...EXPENSE_TYPES].map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filterType === t ? 'bg-brand-600/20 text-brand-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No expenses found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Date', 'Platform', 'Type', 'Description', 'Campaign', 'Method', 'Status', 'Amount', ''].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium py-2 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-3 px-3 text-gray-300 whitespace-nowrap">{formatDate(exp.date)}</td>
                  <td className="py-3 px-3 text-gray-400 whitespace-nowrap">{CHANNEL_LABELS[exp.platform] || exp.platform}</td>
                  <td className="py-3 px-3 text-gray-400 whitespace-nowrap">{exp.expense_type}</td>
                  <td className="py-3 px-3 text-gray-300 max-w-[200px] truncate">{exp.description || '—'}</td>
                  <td className="py-3 px-3 text-gray-400 whitespace-nowrap">{(exp.campaign as any)?.name || '—'}</td>
                  <td className="py-3 px-3 text-gray-400 whitespace-nowrap">{exp.payment_method}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[10px] rounded border font-medium ${STATUS_COLORS[exp.status] || ''}`}>{exp.status}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">{formatINR(exp.amount)}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ ...exp, campaign_id: exp.campaign_id || '' }); setEditId(exp.id); }} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(exp.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td colSpan={7} className="py-3 px-3 text-sm font-medium text-gray-400">Total ({filtered.length} records)</td>
                <td className="py-3 px-3 font-bold text-white">{formatINR(totalSpend)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Expense" message="Delete this expense record?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
