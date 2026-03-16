import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Download, X, AlertTriangle, Camera, Search,
  Filter, TrendingDown, DollarSign, Briefcase, RefreshCw, Zap, Link2,
  BarChart2, FileText, CheckCircle2, Target, CreditCard, Package, Settings2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatINR, formatDate } from '../../lib/format';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import ReceiptScannerModal from './expenses/ReceiptScannerModal';

const CATEGORIES = [
  'Tools & Software', 'AI & APIs', 'Ads & Marketing', 'Team & HR', 'Travel',
  'Office', 'Client Project', 'Food', 'Personal', 'EMI', 'Subscription',
  'Tax', 'Infrastructure', 'Design', 'Other',
];
const TYPES = ['Business', 'Personal', 'Client Project'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank', 'Wire Transfer', 'PayPal', 'Stripe', 'Other'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'AED'];

const CATEGORY_COLORS: Record<string, string> = {
  'Tools & Software': '#3B82F6',
  'AI & APIs': '#8B5CF6',
  'Ads & Marketing': '#F59E0B',
  'Team & HR': '#10B981',
  'Travel': '#06B6D4',
  'Office': '#84CC16',
  'Client Project': '#FF6B00',
  'Food': '#EC4899',
  'Personal': '#6B7280',
  'EMI': '#EF4444',
  'Subscription': '#A855F7',
  'Tax': '#F97316',
  'Infrastructure': '#14B8A6',
  'Design': '#E879F9',
  'Other': '#9CA3AF',
};

const SOURCE_ICONS: Record<string, string> = {
  project: '🗂️',
  subscription: '🔄',
  emi: '💳',
  receipt_scan: '📷',
  manual: '✏️',
};

interface Expense {
  id: string;
  amount: number;
  category: string;
  type: string;
  date: string;
  notes: string;
  payment_method: string;
  vendor?: string;
  project_id?: string | null;
  subscription_id?: string | null;
  is_auto_imported?: boolean;
  source_type?: string;
  currency?: string;
}

interface BudgetLimit {
  id: string;
  category: string;
  monthly_limit: number;
}

interface Project {
  id: string;
  name: string;
  client_name: string;
}

interface ProjectExpense {
  id: string;
  project_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
}

interface Subscription {
  id: string;
  service_name: string;
  category: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: string;
  status: string;
}

interface EMILoan {
  id: string;
  loan_name: string;
  emi_amount: number;
  start_date: string;
  lender_name: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [emiLoans, setEmiLoans] = useState<EMILoan[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics' | 'budget'>('list');
  const [chartView, setChartView] = useState<'monthly' | 'category' | 'type'>('monthly');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState(CATEGORIES[0]);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [editingBudget, setEditingBudget] = useState<BudgetLimit | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const [form, setForm] = useState({
    amount: '', category: CATEGORIES[0], type: TYPES[0],
    date: new Date().toISOString().split('T')[0], notes: '',
    payment_method: PAYMENT_METHODS[0], vendor: '', project_id: '',
    currency: 'INR', source_type: 'manual',
  });

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async (force = false) => {
    setLoading(true);
    await Promise.all([
      loadExpenses(force), loadBudgetLimits(), loadProjects(),
      loadProjectExpenses(), loadSubscriptions(), loadEMILoans(),
    ]);
    setLoading(false);
  };

  const loadExpenses = async (_force = false) => {
    const data = await supabase.from('expenses').select('*').eq('user_id', user!.id).order('date', { ascending: false }).limit(1000).then(r => r.data ?? []);
    setExpenses((data as Record<string, unknown>[]).map((d) => ({ ...d, amount: Number(d.amount) })));
  };

  const loadBudgetLimits = async () => {
    const data = await supabase.from('budget_limits').select('*').eq('user_id', user!.id).then(r => r.data ?? []);
    setBudgetLimits((data as Record<string, unknown>[]).map((d) => ({ ...d, monthly_limit: Number(d.monthly_limit) })));
  };

  const loadProjects = async () => {
    const data = await supabase.from('projects').select('id, name, client_name, status, budget, revenue, start_date, end_date').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100).then(r => r.data ?? []);
    setProjects(data as { id: string; name: string; client_name: string }[]);
  };

  const loadProjectExpenses = async () => {
    const data = await supabase.from('project_expenses').select('*').eq('user_id', user!.id).order('date', { ascending: false }).limit(500).then(r => r.data ?? []);
    setProjectExpenses((data as Record<string, unknown>[]).map((d) => ({ ...d, amount: Number(d.amount) })));
  };

  const loadSubscriptions = async () => {
    const data = await supabase.from('subscriptions').select('*').eq('user_id', user!.id).eq('status', 'active').limit(50).then(r => r.data ?? []);
    setSubscriptions((data as Record<string, unknown>[]).map((d) => ({ ...d, amount: Number(d.amount) })));
  };

  const loadEMILoans = async () => {
    const data = await supabase.from('emi_loans').select('*').eq('user_id', user!.id).limit(30).then(r => r.data ?? []);
    setEmiLoans((data as Record<string, unknown>[]).map((d) => ({ ...d, emi_amount: Number(d.emi_amount) })));
  };

  const syncProjectExpenses = async () => {
    if (!projectExpenses.length) return;
    setSyncing(true);
    let added = 0;
    for (const pe of projectExpenses) {
      const already = expenses.some((e) => e.project_id === pe.project_id && e.source_type === 'project' && e.notes?.includes(pe.description));
      if (already) continue;
      const proj = projects.find((p) => p.id === pe.project_id);
      const { error } = await supabase.from('expenses').insert({
        user_id: user!.id,
        amount: pe.amount,
        category: 'Client Project',
        type: 'Client Project',
        date: pe.date,
        notes: pe.description,
        payment_method: pe.payment_method || 'Bank',
        vendor: proj?.name || '',
        project_id: pe.project_id,
        is_auto_imported: true,
        source_type: 'project',
        currency: 'INR',
      });
      if (!error) added++;
    }
    await loadExpenses();
    setSyncing(false);
    toast.success(added > 0 ? `${added} project expenses imported` : 'All project expenses already synced');
  };

  const syncSubscriptionExpenses = async () => {
    if (!subscriptions.length) return;
    setSyncing(true);
    let added = 0;
    const now = new Date().toISOString().split('T')[0];
    for (const sub of subscriptions) {
      const already = expenses.some((e) => e.subscription_id === sub.id && e.date.slice(0, 7) === now.slice(0, 7));
      if (already) continue;
      const { error } = await supabase.from('expenses').insert({
        user_id: user!.id,
        amount: sub.amount,
        category: 'Subscription',
        type: 'Business',
        date: sub.next_billing_date || now,
        notes: `Auto: ${sub.service_name} (${sub.billing_cycle})`,
        payment_method: 'Card',
        vendor: sub.service_name,
        subscription_id: sub.id,
        is_auto_imported: true,
        source_type: 'subscription',
        currency: sub.currency || 'INR',
      });
      if (!error) added++;
    }
    await loadExpenses();
    setSyncing(false);
    toast.success(added > 0 ? `${added} subscription expenses imported` : 'All subscriptions already synced');
  };

  const syncEMIExpenses = async () => {
    if (!emiLoans.length) return;
    setSyncing(true);
    let added = 0;
    const now = new Date().toISOString().split('T')[0];
    for (const emi of emiLoans) {
      const already = expenses.some((e) => e.source_type === 'emi' && e.notes?.includes(emi.loan_name) && e.date.slice(0, 7) === now.slice(0, 7));
      if (already) continue;
      const { error } = await supabase.from('expenses').insert({
        user_id: user!.id,
        amount: emi.emi_amount,
        category: 'EMI',
        type: 'Personal',
        date: now,
        notes: `EMI: ${emi.loan_name}${emi.lender_name ? ` (${emi.lender_name})` : ''}`,
        payment_method: 'Bank',
        vendor: emi.lender_name || emi.loan_name,
        is_auto_imported: true,
        source_type: 'emi',
        currency: 'INR',
      });
      if (!error) added++;
    }
    await loadExpenses();
    setSyncing(false);
    toast.success(added > 0 ? `${added} EMI expenses imported` : 'All EMIs already synced this month');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Please enter a valid amount'); return; }
    const payload = {
      amount: Number(form.amount), category: form.category, type: form.type,
      date: form.date, notes: form.notes, payment_method: form.payment_method,
      vendor: form.vendor, project_id: form.project_id || null, currency: form.currency,
      source_type: form.project_id ? 'project' : 'manual', is_auto_imported: false,
    };
    if (editing) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Expense updated');
    } else {
      const { error } = await supabase.from('expenses').insert({ ...payload, user_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success('Expense added');
    }
    resetForm();
    loadExpenses(true);
  };

  const handleEdit = (exp: Expense) => {
    setEditing(exp);
    setForm({
      amount: String(exp.amount), category: exp.category, type: exp.type,
      date: exp.date, notes: exp.notes || '', payment_method: exp.payment_method,
      vendor: exp.vendor || '', project_id: exp.project_id || '',
      currency: exp.currency || 'INR', source_type: exp.source_type || 'manual',
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('expenses').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Expense deleted');
    loadExpenses(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ amount: '', category: CATEGORIES[0], type: TYPES[0], date: new Date().toISOString().split('T')[0], notes: '', payment_method: PAYMENT_METHODS[0], vendor: '', project_id: '', currency: 'INR', source_type: 'manual' });
  };

  const saveBudget = async () => {
    if (!budgetAmount || Number(budgetAmount) <= 0) { toast.error('Enter a valid budget amount'); return; }
    const existing = editingBudget || budgetLimits.find((b) => b.category === budgetCategory);
    if (existing) {
      await supabase.from('budget_limits').update({ monthly_limit: Number(budgetAmount) }).eq('id', existing.id);
    } else {
      await supabase.from('budget_limits').insert({ user_id: user!.id, category: budgetCategory, monthly_limit: Number(budgetAmount) });
    }
    toast.success('Budget limit saved');
    setShowBudgetForm(false);
    setBudgetAmount('');
    setEditingBudget(null);
    loadBudgetLimits();
  };

  const deleteBudget = async (id: string) => {
    await supabase.from('budget_limits').delete().eq('id', id);
    toast.success('Budget removed');
    loadBudgetLimits();
  };

  const exportCSV = () => {
    const rows = [
      ['Date', 'Vendor', 'Category', 'Type', 'Source', 'Amount', 'Currency', 'Payment Method', 'Notes'],
      ...filtered.map((e) => [e.date, e.vendor || '', e.category, e.type, e.source_type || 'manual', e.amount, e.currency || 'INR', e.payment_method, `"${e.notes || ''}"`]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const monthlyTotal = expenses.filter((e) => e.date >= monthStart && e.date <= monthEnd).reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = expenses.filter((e) => e.date >= lastMonthStart && e.date <= lastMonthEnd).reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const projectExpTotal = expenses.filter((e) => e.source_type === 'project' || e.type === 'Client Project').reduce((s, e) => s + e.amount, 0);
  const aiToolsTotal = expenses.filter((e) => e.category === 'AI & APIs' || e.category === 'Tools & Software').reduce((s, e) => s + e.amount, 0);
  const monthChange = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const budgetWarnings = budgetLimits.map((bl) => {
    const spent = expenses.filter((e) => e.category === bl.category && e.date >= monthStart && e.date <= monthEnd).reduce((s, e) => s + e.amount, 0);
    const pct = bl.monthly_limit > 0 ? (spent / bl.monthly_limit) * 100 : 0;
    return { ...bl, spent, pct };
  }).filter((b) => b.pct >= 80);

  const budgetProgress = budgetLimits.map((bl) => {
    const spent = expenses.filter((e) => e.category === bl.category && e.date >= monthStart && e.date <= monthEnd).reduce((s, e) => s + e.amount, 0);
    const pct = bl.monthly_limit > 0 ? Math.min((spent / bl.monthly_limit) * 100, 100) : 0;
    return { ...bl, spent, pct };
  }).sort((a, b) => b.pct - a.pct);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory && e.category !== filterCategory) return false;
      if (filterType && e.type !== filterType) return false;
      if (filterSource && e.source_type !== filterSource) return false;
      if (filterFrom && e.date < filterFrom) return false;
      if (filterTo && e.date > filterTo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!e.vendor?.toLowerCase().includes(q) && !e.notes?.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [expenses, filterCategory, filterType, filterSource, filterFrom, filterTo, searchQuery]);

  const monthlyChartData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { const m = e.date.slice(0, 7); map[m] = (map[m] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, amount]) => ({
      name: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), amount,
    }));
  }, [expenses]);

  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const typeChartData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.type] = (map[e.type] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const topVendors = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { if (e.vendor) map[e.vendor] = (map[e.vendor] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const PIE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#6B7280'];

  const unlinkedProjectExp = projectExpenses.filter((pe) => !expenses.some((e) => e.source_type === 'project' && e.notes?.includes(pe.description) && e.project_id === pe.project_id));
  const unlinkedSubscriptions = subscriptions.filter((s) => !expenses.some((e) => e.subscription_id === s.id && e.date.slice(0, 7) === now.toISOString().slice(0, 7)));
  const unlinkedEMIs = emiLoans.filter((em) => !expenses.some((e) => e.source_type === 'emi' && e.notes?.includes(em.loan_name) && e.date.slice(0, 7) === now.toISOString().slice(0, 7)));
  const hasAutoImports = unlinkedProjectExp.length > 0 || unlinkedSubscriptions.length > 0 || unlinkedEMIs.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track, analyze and import all expense streams</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowBudgetForm(true)} className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-gray-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> Set Budget
          </button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-gray-400 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => setShowScanner(true)} className="px-3 py-2 rounded-lg border border-brand-500/30 hover:bg-brand-500/5 text-brand-400 text-xs flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Scan Receipt
          </button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-semibold rounded-lg gradient-orange text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'This Month', value: formatINR(monthlyTotal),
            sub: monthChange <= 0 ? `${monthChange.toFixed(0)}% vs last month` : `+${monthChange.toFixed(0)}% vs last month`,
            subColor: monthChange <= 0 ? 'text-emerald-400' : 'text-red-400',
            icon: <TrendingDown className="w-4 h-4 text-red-400" />, border: 'border-red-500/40',
          },
          {
            label: 'Total All Time', value: formatINR(totalAll),
            sub: `${expenses.length} entries`, subColor: 'text-gray-500',
            icon: <DollarSign className="w-4 h-4 text-blue-400" />, border: 'border-blue-500/40',
          },
          {
            label: 'Project Costs', value: formatINR(projectExpTotal),
            sub: `${expenses.filter((e) => e.source_type === 'project' || e.type === 'Client Project').length} entries`, subColor: 'text-gray-500',
            icon: <Briefcase className="w-4 h-4 text-[#FF6B00]" />, border: 'border-[#FF6B00]/40',
          },
          {
            label: 'AI & Tools', value: formatINR(aiToolsTotal),
            sub: `${expenses.filter((e) => e.category === 'AI & APIs' || e.category === 'Tools & Software').length} entries`, subColor: 'text-gray-500',
            icon: <Settings2 className="w-4 h-4 text-cyan-400" />, border: 'border-cyan-500/40',
          },
        ].map((s) => (
          <div key={s.label} className={`glass-card rounded-xl p-4 border-t-2 ${s.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">{s.icon}</div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
            <p className="text-xl font-black text-white">{s.value}</p>
            <p className={`text-xs mt-1 ${s.subColor}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {budgetWarnings.length > 0 && (
        <div className="space-y-2">
          {budgetWarnings.map((bw) => (
            <div key={bw.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${bw.pct >= 100 ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="flex-1">
                <strong>{bw.category}:</strong> {formatINR(bw.spent)} of {formatINR(bw.monthly_limit)} ({Math.round(bw.pct)}%)
                {bw.pct >= 100 ? ' — Budget exceeded!' : ' — Approaching limit'}
              </span>
              <div className="w-24 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${bw.pct >= 100 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(bw.pct, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasAutoImports && (
        <div className="glass-card rounded-xl p-4 border border-red-500/15 bg-red-500/5">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Auto-Import Available</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {unlinkedProjectExp.length > 0 && `${unlinkedProjectExp.length} project expenses. `}
                {unlinkedSubscriptions.length > 0 && `${unlinkedSubscriptions.length} active subscriptions. `}
                {unlinkedEMIs.length > 0 && `${unlinkedEMIs.length} EMI payments not yet recorded.`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {unlinkedProjectExp.length > 0 && (
                <button onClick={syncProjectExpenses} disabled={syncing} className="px-3 py-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#e55f00] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
                  {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Briefcase className="w-3 h-3" />} Projects
                </button>
              )}
              {unlinkedSubscriptions.length > 0 && (
                <button onClick={syncSubscriptionExpenses} disabled={syncing} className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
                  {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />} Subscriptions
                </button>
              )}
              {unlinkedEMIs.length > 0 && (
                <button onClick={syncEMIExpenses} disabled={syncing} className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
                  {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />} EMIs
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        {([['list', 'Records', FileText], ['analytics', 'Analytics', BarChart2], ['budget', 'Budget', Target]] as const).map(([tab, label, Icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            {(['monthly', 'category', 'type'] as const).map((v) => (
              <button key={v} onClick={() => setChartView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${chartView === v ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'border border-white/10 text-gray-500 hover:text-gray-300'}`}>
                {v === 'monthly' ? 'Monthly Trend' : v === 'category' ? 'By Category' : 'By Type'}
              </button>
            ))}
          </div>

          {chartView === 'monthly' && (
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-4">Monthly Expenses — Last 12 Months</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area dataKey="amount" name="Expenses" stroke="#EF4444" strokeWidth={2} fill="url(#expGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {chartView === 'category' && (
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-4">Expenses by Category</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={categoryChartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">
                        {categoryChartData.map((entry, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: 8 }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 self-center">
                  {categoryChartData.slice(0, 8).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[item.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-400 flex-1 truncate">{item.name}</span>
                      <div className="w-16 h-1 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.name] || PIE_COLORS[i % PIE_COLORS.length], width: `${(item.value / totalAll) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-white w-20 text-right">{formatINR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {chartView === 'type' && (
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-4">Expenses by Type</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Expenses" radius={[4, 4, 0, 0]}>
                      {typeChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {topVendors.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-[#FF6B00]" />
                <p className="text-sm font-semibold text-white">Top Vendors / Services</p>
              </div>
              <div className="space-y-2.5">
                {topVendors.map((v, i) => (
                  <div key={v.name} className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600 w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-300 font-medium truncate">{v.name}</span>
                        <span className="text-xs font-bold text-red-400 ml-2">{formatINR(v.value)}</span>
                      </div>
                      <div className="w-full h-1 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${(v.value / topVendors[0].value) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subscriptions.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-[#8B5CF6]" />
                <p className="text-sm font-semibold text-white">Active Subscriptions</p>
                <span className="text-[10px] bg-[#8B5CF6]/10 text-[#8B5CF6] px-1.5 py-0.5 rounded-full border border-[#8B5CF6]/20">{subscriptions.length}</span>
              </div>
              <div className="space-y-2">
                {subscriptions.map((s) => {
                  const synced = expenses.some((e) => e.subscription_id === s.id);
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 hover:bg-white/[0.02]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{s.service_name}</p>
                        <p className="text-[10px] text-gray-500">{s.billing_cycle} · {s.category}</p>
                      </div>
                      <span className="text-sm font-bold text-red-400">{formatINR(s.amount)}</span>
                      {synced ? (
                        <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Synced</span>
                      ) : (
                        <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Pending</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{budgetProgress.length} budget{budgetProgress.length !== 1 ? 's' : ''} set for this month</p>
            <button onClick={() => setShowBudgetForm(true)} className="px-3 py-1.5 rounded-lg gradient-orange text-white text-xs font-semibold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Budget
            </button>
          </div>
          {budgetProgress.length === 0 ? (
            <EmptyState title="No budgets set" description="Set monthly budget limits per category to track your spending." />
          ) : (
            <div className="space-y-3">
              {budgetProgress.map((b) => (
                <div key={b.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[b.category] || '#6B7280' }} />
                    <span className="text-sm font-medium text-white flex-1">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingBudget(b); setBudgetCategory(b.category); setBudgetAmount(String(b.monthly_limit)); setShowBudgetForm(true); }} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteBudget(b.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500">Spent: <span className={b.pct >= 100 ? 'text-red-400 font-bold' : 'text-white'}>{formatINR(b.spent)}</span></span>
                    <span className="text-gray-500">Limit: {formatINR(b.monthly_limit)}</span>
                    <span className={`font-semibold ${b.pct >= 100 ? 'text-red-400' : b.pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.round(b.pct)}%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${b.pct >= 100 ? 'bg-red-500' : b.pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  {b.monthly_limit > b.spent && (
                    <p className="text-[10px] text-gray-600 mt-1.5">Remaining: {formatINR(b.monthly_limit - b.spent)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search vendor, category, notes..." className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2.5 rounded-xl border text-sm flex items-center gap-2 transition-all ${showFilters ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}>
              <Filter className="w-4 h-4" /> Filters
              {(filterCategory || filterType || filterSource || filterFrom || filterTo) && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>
          </div>

          {showFilters && (
            <div className="glass-card rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none">
                  <option value="">All</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Type</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none">
                  <option value="">All</option>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Source</label>
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none">
                  <option value="">All</option>
                  <option value="manual">Manual</option>
                  <option value="project">Project</option>
                  <option value="subscription">Subscription</option>
                  <option value="emi">EMI</option>
                  <option value="receipt_scan">Receipt Scan</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">From</label>
                <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">To</label>
                <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{filtered.length} records · {formatINR(filtered.reduce((s, e) => s + e.amount, 0))} total</p>
            {(filterCategory || filterType || filterSource || filterFrom || filterTo || searchQuery) && (
              <button onClick={() => { setFilterCategory(''); setFilterType(''); setFilterSource(''); setFilterFrom(''); setFilterTo(''); setSearchQuery(''); }} className="text-xs text-red-400 hover:underline">Clear filters</button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No expenses found" description="Add your first expense or import from projects, subscriptions, or scan a receipt." />
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-white/5">
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vendor / Category</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Payment</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((exp) => {
                      const isExpanded = expandedRow === exp.id;
                      const linkedProject = exp.project_id ? projects.find((p) => p.id === exp.project_id) : null;
                      return (
                        <>
                          <tr
                            key={exp.id}
                            onClick={() => setExpandedRow(isExpanded ? null : exp.id)}
                            className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(exp.date)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  {exp.vendor && <p className="text-sm text-white font-medium leading-none">{exp.vendor}</p>}
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${CATEGORY_COLORS[exp.category] || '#6B7280'}20`, color: CATEGORY_COLORS[exp.category] || '#6B7280' }}>
                                      {exp.category}
                                    </span>
                                    {exp.is_auto_imported && (
                                      <span className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded-full">Auto</span>
                                    )}
                                    {exp.project_id && <Link2 className="w-3 h-3 text-[#FF6B00]" />}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{exp.type}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{exp.payment_method}</td>
                            <td className="px-4 py-3 text-right font-bold text-red-400 whitespace-nowrap">{formatINR(exp.amount)}</td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1">
                                <button onClick={() => handleEdit(exp)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setDeleteId(exp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${exp.id}-exp`} className="bg-white/[0.01] border-b border-white/5">
                              <td colSpan={6} className="px-4 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  {exp.notes && (
                                    <div>
                                      <p className="text-gray-600 mb-0.5">Notes</p>
                                      <p className="text-gray-300">{exp.notes}</p>
                                    </div>
                                  )}
                                  {exp.currency && exp.currency !== 'INR' && (
                                    <div>
                                      <p className="text-gray-600 mb-0.5">Currency</p>
                                      <p className="text-gray-300">{exp.currency}</p>
                                    </div>
                                  )}
                                  {linkedProject && (
                                    <div>
                                      <p className="text-gray-600 mb-0.5">Linked Project</p>
                                      <p className="text-[#FF6B00] font-medium">{linkedProject.name}</p>
                                    </div>
                                  )}
                                  {exp.source_type && exp.source_type !== 'manual' && (
                                    <div>
                                      <p className="text-gray-600 mb-0.5">Source</p>
                                      <p className="text-blue-400 capitalize">{SOURCE_ICONS[exp.source_type] || ''} {exp.source_type}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={resetForm} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Amount *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Vendor / Service Name</label>
                <input type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. OpenRouter, Kie.ai, AWS, Adobe..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Payment Method</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {projects.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Link to Project (optional)</label>
                  <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value, type: e.target.value ? 'Client Project' : form.type })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    <option value="">No project link</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none" placeholder="Optional notes..." />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm">
                {editing ? 'Update Expense' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showBudgetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editingBudget ? 'Edit Budget' : 'Set Budget Limit'}</h2>
              <button onClick={() => { setShowBudgetForm(false); setEditingBudget(null); setBudgetAmount(''); }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Monthly Limit (INR)</label>
                <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="0" />
              </div>
              <button onClick={saveBudget} className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm">
                Save Budget Limit
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptScannerModal open={showScanner} onClose={() => setShowScanner(false)} onSaved={loadExpenses} />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
