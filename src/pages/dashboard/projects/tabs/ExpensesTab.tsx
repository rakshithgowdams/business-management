import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR, formatDate } from '../../../../lib/format';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../../../lib/projects/constants';
import type { ProjectExpense } from '../../../../lib/projects/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  projectId: string;
  expenses: ProjectExpense[];
  onRefresh: () => void;
  autoOpenAdd?: boolean;
}

export default function ExpensesTab({ projectId, expenses, onRefresh, autoOpenAdd }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProjectExpense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');

  const [form, setForm] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0] as string,
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: PAYMENT_METHODS[0] as string,
    receipt_note: '',
  });

  useEffect(() => {
    if (autoOpenAdd) setShowForm(true);
  }, [autoOpenAdd]);

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({
      amount: '',
      category: EXPENSE_CATEGORIES[0] as string,
      description: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: PAYMENT_METHODS[0] as string,
      receipt_note: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }

    const payload = {
      amount: Number(form.amount),
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      payment_method: form.payment_method,
      receipt_note: form.receipt_note.trim(),
    };

    if (editing) {
      const { error } = await supabase.from('project_expenses').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Expense updated');
    } else {
      const { error } = await supabase.from('project_expenses').insert({
        ...payload,
        project_id: projectId,
        user_id: user!.id,
      });
      if (error) { toast.error(error.message); return; }
      toast.success('Expense added');
    }
    resetForm();
    onRefresh();
  };

  const handleEdit = (exp: ProjectExpense) => {
    setEditing(exp);
    setForm({
      amount: String(exp.amount),
      category: exp.category,
      description: exp.description,
      date: exp.date,
      payment_method: exp.payment_method,
      receipt_note: exp.receipt_note,
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('project_expenses').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Expense deleted');
    onRefresh();
  };

  const filtered = useMemo(() => {
    if (!filterCat) return expenses;
    return expenses.filter((e) => e.category === filterCat);
  }, [expenses, filterCat]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  const catChartData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-sm text-white">
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-semibold rounded-lg gradient-orange text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => (
                  <tr key={exp.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-400">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{exp.description}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-md bg-dark-600 text-gray-300">{exp.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-400">{formatINR(exp.amount)}</td>
                    <td className="px-4 py-3 text-gray-400">{exp.payment_method}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(exp)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(exp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-white/5 flex justify-between text-sm">
            <span className="text-gray-400">{filtered.length} expense{filtered.length !== 1 ? 's' : ''}</span>
            <span className="font-semibold text-orange-400">Total: {formatINR(totalAmount)}</span>
          </div>
        </div>
      )}

      {catChartData.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Spend per Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis type="number" stroke="#666" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#666" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{ background: '#1E1E1E', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(value: number | undefined) => formatINR(value ?? 0)}
                />
                <Bar dataKey="value" fill="#FF6B00" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">No expenses logged yet. Click "Add Expense" to get started.</div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount (INR) *</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description *</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. n8n cloud subscription" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Payment Method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Receipt Note</label>
                <textarea value={form.receipt_note} onChange={(e) => setForm({ ...form, receipt_note: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">
                {editing ? 'Update Expense' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Expense"
        message="Are you sure? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
