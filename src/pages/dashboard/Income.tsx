import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, X, TrendingUp, TrendingDown, DollarSign,
  Briefcase, FileText, Filter, Search, Download, ChevronDown, ChevronUp,
  RefreshCw, BarChart2, PieChart, Calendar, Zap, CheckCircle2, Link2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/format';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';

const SOURCES = ['Freelance', 'Client Payment', 'Project Revenue', 'Invoice Payment', 'Retainer', 'Community', 'Affiliate', 'Consulting', 'Other'];
const CATEGORIES = ['General', 'Design', 'Development', 'Marketing', 'Consulting', 'Product', 'Service', 'Other'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'AED'];
const PAYMENT_METHODS = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'PayPal', 'Stripe', 'Wire Transfer', 'Other'];

const SOURCE_COLORS: Record<string, string> = {
  'Project Revenue': '#FF6B00',
  'Client Payment': '#10B981',
  'Invoice Payment': '#3B82F6',
  Freelance: '#F59E0B',
  Retainer: '#8B5CF6',
  Consulting: '#06B6D4',
  Community: '#EC4899',
  Affiliate: '#84CC16',
  Other: '#6B7280',
};

interface IncomeRecord {
  id: string;
  amount: number;
  source: string;
  date: string;
  notes: string;
  client_name: string;
  currency: string;
  category?: string;
  payment_method?: string;
  project_id?: string | null;
  invoice_id?: string | null;
  is_project_income?: boolean;
  project_name?: string;
  invoice_number?: string;
}

interface Project {
  id: string;
  name: string;
  client_name: string;
  revenue: number;
  status: string;
  end_date: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  to_client_name: string;
  total: number;
  status: string;
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

export default function Income() {
  const { user } = useAuth();
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IncomeRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [chartView, setChartView] = useState<'monthly' | 'source' | 'category'>('monthly');
  const [filterSource, setFilterSource] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const [form, setForm] = useState({
    amount: '',
    source: SOURCES[0],
    category: CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
    notes: '',
    client_name: '',
    currency: 'INR',
    payment_method: 'Bank Transfer',
    project_id: '',
    invoice_id: '',
    is_project_income: false,
  });

  useEffect(() => {
    if (user) loadAll(false);
  }, [user]);

  const loadAll = async (force = false) => {
    setLoading(true);
    await Promise.all([loadData(force), loadProjects(), loadInvoices()]);
    setLoading(false);
  };

  const loadData = async (_force = false) => {
    const data = await supabase.from('income').select('*').eq('user_id', user!.id).order('date', { ascending: false }).limit(1000).then(r => r.data ?? []);
    const enriched = (data as Record<string, unknown>[]).map((d) => ({ ...d, amount: Number(d.amount) }));
    setRecords(enriched);
  };

  const loadProjects = async () => {
    const data = await supabase.from('projects').select('id, name, client_name, revenue, status, end_date, budget, start_date').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100).then(r => r.data ?? []);
    setProjects(data as { id: string; name: string; client_name: string; revenue: number; status: string; end_date: string }[]);
  };

  const loadInvoices = async () => {
    const data = await supabase.from('invoices').select('id, invoice_number, to_client_name, total, status, issue_date, due_date').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100).then(r => r.data ?? []);
    setInvoices((data as Record<string, unknown>[]).filter((i) => i.status === 'paid') as { id: string; invoice_number: string; to_client_name: string; total: number; status: string }[]);
  };

  const syncProjectIncome = async () => {
    if (!projects.length) return;
    setSyncing(true);
    let added = 0;

    for (const proj of projects) {
      if (!proj.revenue || proj.revenue <= 0) continue;
      const alreadyExists = records.some((r) => r.project_id === proj.id && r.is_project_income);
      if (alreadyExists) continue;

      const { error } = await supabase.from('income').insert({
        user_id: user!.id,
        amount: proj.revenue,
        source: 'Project Revenue',
        category: 'General',
        date: proj.end_date || new Date().toISOString().split('T')[0],
        notes: `Auto-imported from project: ${proj.name}`,
        client_name: proj.client_name,
        currency: 'INR',
        payment_method: 'Bank Transfer',
        project_id: proj.id,
        is_project_income: true,
      });
      if (!error) added++;
    }

    await loadData();
    setSyncing(false);
    if (added > 0) {
      toast.success(`${added} project income${added > 1 ? 's' : ''} imported`);
    } else {
      toast.success('All projects already synced');
    }
  };

  const syncInvoiceIncome = async () => {
    if (!invoices.length) return;
    setSyncing(true);
    let added = 0;

    for (const inv of invoices) {
      if (!inv.total || inv.total <= 0) continue;
      const alreadyExists = records.some((r) => r.invoice_id === inv.id);
      if (alreadyExists) continue;

      const { error } = await supabase.from('income').insert({
        user_id: user!.id,
        amount: inv.total,
        source: 'Invoice Payment',
        category: 'General',
        date: new Date().toISOString().split('T')[0],
        notes: `Auto-imported from Invoice #${inv.invoice_number}`,
        client_name: inv.to_client_name,
        currency: 'INR',
        payment_method: 'Bank Transfer',
        invoice_id: inv.id,
        is_project_income: false,
      });
      if (!error) added++;
    }

    await loadData();
    setSyncing(false);
    if (added > 0) {
      toast.success(`${added} paid invoice${added > 1 ? 's' : ''} imported`);
    } else {
      toast.success('All paid invoices already synced');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const payload = {
      amount: Number(form.amount),
      source: form.source,
      category: form.category,
      date: form.date,
      notes: form.notes,
      client_name: form.client_name,
      currency: form.currency,
      payment_method: form.payment_method,
      project_id: form.project_id || null,
      invoice_id: form.invoice_id || null,
      is_project_income: form.is_project_income,
    };

    if (editing) {
      const { error } = await supabase.from('income').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Income updated');
    } else {
      const { error } = await supabase.from('income').insert({ ...payload, user_id: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success('Income added');
    }
    resetForm();
    loadData(true);
  };

  const handleEdit = (rec: IncomeRecord) => {
    setEditing(rec);
    setForm({
      amount: String(rec.amount),
      source: rec.source,
      category: rec.category || 'General',
      date: rec.date,
      notes: rec.notes || '',
      client_name: rec.client_name || '',
      currency: rec.currency,
      payment_method: rec.payment_method || 'Bank Transfer',
      project_id: rec.project_id || '',
      invoice_id: rec.invoice_id || '',
      is_project_income: rec.is_project_income || false,
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('income').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Income deleted');
    loadData(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({
      amount: '', source: SOURCES[0], category: CATEGORIES[0],
      date: new Date().toISOString().split('T')[0],
      notes: '', client_name: '', currency: 'INR',
      payment_method: 'Bank Transfer', project_id: '', invoice_id: '', is_project_income: false,
    });
  };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const monthlyTotal = records.filter((r) => r.date >= monthStart && r.date <= monthEnd).reduce((s, r) => s + r.amount, 0);
  const lastMonthTotal = records.filter((r) => r.date >= lastMonthStart && r.date <= lastMonthEnd).reduce((s, r) => s + r.amount, 0);
  const totalAll = records.reduce((s, r) => s + r.amount, 0);
  const projectIncomeTotal = records.filter((r) => r.is_project_income || r.source === 'Project Revenue').reduce((s, r) => s + r.amount, 0);
  const invoiceIncomeTotal = records.filter((r) => r.source === 'Invoice Payment').reduce((s, r) => s + r.amount, 0);
  const monthChange = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const uniqueMonths = useMemo(() => {
    const months = new Set(records.map((r) => r.date.slice(0, 7)));
    return ['All', ...Array.from(months).sort().reverse()];
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSource = filterSource === 'All' || r.source === filterSource;
      const matchMonth = filterMonth === 'All' || r.date.startsWith(filterMonth);
      const matchSearch = !searchQuery || r.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.source?.toLowerCase().includes(searchQuery.toLowerCase()) || r.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSource && matchMonth && matchSearch;
    });
  }, [records, filterSource, filterMonth, searchQuery]);

  const monthlyChartData = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const m = r.date.slice(0, 7);
      map[m] = (map[m] || 0) + r.amount;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, amount]) => ({
      name: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      amount,
    }));
  }, [records]);

  const sourceChartData = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => { map[r.source] = (map[r.source] || 0) + r.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [records]);

  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => { const c = r.category || 'General'; map[c] = (map[c] || 0) + r.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [records]);

  const unlinkedProjects = projects.filter((p) => p.revenue > 0 && !records.some((r) => r.project_id === p.id && r.is_project_income));
  const unlinkedInvoices = invoices.filter((i) => !records.some((r) => r.invoice_id === i.id));

  const exportCSV = () => {
    const rows = [
      ['Date', 'Source', 'Category', 'Client', 'Amount', 'Currency', 'Payment Method', 'Notes'],
      ...filteredRecords.map((r) => [r.date, r.source, r.category || '', r.client_name || '', r.amount, r.currency, r.payment_method || '', r.notes || '']),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PIE_COLORS = ['#FF6B00', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#84CC16'];

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
          <h1 className="text-2xl font-bold">Income</h1>
          <p className="text-sm text-gray-500 mt-1">Track, analyze and import all income streams</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-gray-400 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-semibold rounded-lg gradient-orange text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'This Month',
            value: formatCurrency(monthlyTotal, 'INR'),
            sub: monthChange >= 0 ? `+${monthChange.toFixed(0)}% vs last month` : `${monthChange.toFixed(0)}% vs last month`,
            subColor: monthChange >= 0 ? 'text-emerald-400' : 'text-red-400',
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
            border: 'border-emerald-500/40',
          },
          {
            label: 'Total All Time',
            value: formatCurrency(totalAll, 'INR'),
            sub: `${records.length} entries`,
            subColor: 'text-gray-500',
            icon: <DollarSign className="w-4 h-4 text-blue-400" />,
            border: 'border-blue-500/40',
          },
          {
            label: 'Project Revenue',
            value: formatCurrency(projectIncomeTotal, 'INR'),
            sub: `${records.filter((r) => r.is_project_income || r.source === 'Project Revenue').length} entries`,
            subColor: 'text-gray-500',
            icon: <Briefcase className="w-4 h-4 text-[#FF6B00]" />,
            border: 'border-[#FF6B00]/40',
          },
          {
            label: 'Invoice Income',
            value: formatCurrency(invoiceIncomeTotal, 'INR'),
            sub: `${records.filter((r) => r.source === 'Invoice Payment').length} entries`,
            subColor: 'text-gray-500',
            icon: <FileText className="w-4 h-4 text-cyan-400" />,
            border: 'border-cyan-500/40',
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

      {(unlinkedProjects.length > 0 || unlinkedInvoices.length > 0) && (
        <div className="glass-card rounded-xl p-4 border border-[#FF6B00]/15 bg-[#FF6B00]/5">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-[#FF6B00] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Auto-Import Available</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {unlinkedProjects.length > 0 && `${unlinkedProjects.length} projects with revenue not yet imported. `}
                {unlinkedInvoices.length > 0 && `${unlinkedInvoices.length} paid invoices not yet imported.`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unlinkedProjects.length > 0 && (
                <button
                  onClick={syncProjectIncome}
                  disabled={syncing}
                  className="px-3 py-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#e55f00] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Briefcase className="w-3 h-3" />}
                  Import Projects
                </button>
              )}
              {unlinkedInvoices.length > 0 && (
                <button
                  onClick={syncInvoiceIncome}
                  disabled={syncing}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  Import Invoices
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Records</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Analytics</span>
        </button>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            {(['monthly', 'source', 'category'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${chartView === v ? 'bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00]' : 'border border-white/10 text-gray-500 hover:text-gray-300'}`}
              >
                {v === 'monthly' ? 'Monthly Trend' : v === 'source' ? 'By Source' : 'By Category'}
              </button>
            ))}
          </div>

          {chartView === 'monthly' && (
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-4">Monthly Income — Last 12 Months</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area dataKey="amount" name="Income" stroke="#10B981" strokeWidth={2} fill="url(#incomeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {chartView === 'source' && (
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-4">Income by Source</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={sourceChartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">
                        {sourceChartData.map((entry, i) => (
                          <Cell key={i} fill={SOURCE_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v, 'INR')} contentStyle={{ backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: 8 }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 self-center">
                  {sourceChartData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[item.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-400 flex-1 truncate">{item.name}</span>
                      <div className="w-16 h-1 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: SOURCE_COLORS[item.name] || PIE_COLORS[i % PIE_COLORS.length], width: `${(item.value / totalAll) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-white w-20 text-right">{formatCurrency(item.value, 'INR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {chartView === 'category' && (
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-4">Income by Category</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Income" radius={[0, 4, 4, 0]}>
                      {categoryChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-[#FF6B00]" />
                <p className="text-sm font-semibold text-white">Project Revenue Overview</p>
              </div>
              <div className="space-y-2">
                {projects.filter((p) => p.revenue > 0).sort((a, b) => b.revenue - a.revenue).map((p) => {
                  const linked = records.some((r) => r.project_id === p.id && r.is_project_income);
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 hover:bg-white/[0.02]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-500">{p.client_name} · {p.status}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(p.revenue, 'INR')}</span>
                      {linked ? (
                        <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Imported</span>
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

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, source or notes..."
                className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2.5 rounded-xl border text-sm flex items-center gap-2 transition-all ${showFilters ? 'border-[#FF6B00]/40 bg-[#FF6B00]/10 text-[#FF6B00]' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              <Filter className="w-4 h-4" /> Filters
              {(filterSource !== 'All' || filterMonth !== 'All') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="glass-card rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Source</label>
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none">
                  {['All', ...SOURCES].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Month</label>
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none">
                  {uniqueMonths.map((m) => (
                    <option key={m} value={m}>{m === 'All' ? 'All Months' : new Date(m + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{filteredRecords.length} records · {formatCurrency(filteredRecords.reduce((s, r) => s + r.amount, 0), 'INR')} total</p>
            {(filterSource !== 'All' || filterMonth !== 'All' || searchQuery) && (
              <button onClick={() => { setFilterSource('All'); setFilterMonth('All'); setSearchQuery(''); }} className="text-xs text-[#FF6B00] hover:underline">Clear filters</button>
            )}
          </div>

          {filteredRecords.length === 0 ? (
            <EmptyState title="No income records" description="Add your first income entry or import from projects/invoices." />
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-white/5">
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Method</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((rec) => {
                      const isExpanded = expandedRecord === rec.id;
                      const linkedProject = rec.project_id ? projects.find((p) => p.id === rec.project_id) : null;
                      return (
                        <>
                          <tr
                            key={rec.id}
                            onClick={() => setExpandedRecord(isExpanded ? null : rec.id)}
                            className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(rec.date)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                                  style={{ backgroundColor: `${SOURCE_COLORS[rec.source] || '#6B7280'}20`, color: SOURCE_COLORS[rec.source] || '#6B7280' }}
                                >
                                  {rec.source}
                                </span>
                                {(rec.is_project_income || rec.project_id) && (
                                  <Link2 className="w-3 h-3 text-[#FF6B00]" title="Linked to project" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 max-w-[120px] truncate">{rec.client_name || '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{rec.category || 'General'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{rec.payment_method || '—'}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-400 whitespace-nowrap">{formatCurrency(rec.amount, rec.currency)}</td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1">
                                <button onClick={() => handleEdit(rec)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setDeleteId(rec.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${rec.id}-exp`} className="bg-white/[0.01] border-b border-white/5">
                              <td colSpan={7} className="px-4 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  {rec.notes && (
                                    <div>
                                      <p className="text-gray-600 mb-0.5">Notes</p>
                                      <p className="text-gray-300">{rec.notes}</p>
                                    </div>
                                  )}
                                  {rec.currency && rec.currency !== 'INR' && (
                                    <div>
                                      <p className="text-gray-600 mb-0.5">Currency</p>
                                      <p className="text-gray-300">{rec.currency}</p>
                                    </div>
                                  )}
                                  {linkedProject && (
                                    <div>
                                      <p className="text-gray-600 mb-0.5">Linked Project</p>
                                      <p className="text-[#FF6B00] font-medium">{linkedProject.name}</p>
                                    </div>
                                  )}
                                  {rec.invoice_id && (
                                    <div>
                                      <p className="text-gray-600 mb-0.5">Invoice</p>
                                      <p className="text-blue-400">#{invoices.find((i) => i.id === rec.invoice_id)?.invoice_number || 'linked'}</p>
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
                <h2 className="text-lg font-semibold">{editing ? 'Edit Income' : 'Add Income'}</h2>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Source</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Client Name</label>
                  <input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Payment Method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Link to Project (optional)</label>
                  <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value, is_project_income: !!e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    <option value="">No project link</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>)}
                  </select>
                </div>
              )}

              {invoices.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Link to Invoice (optional)</label>
                  <select value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                    <option value="">No invoice link</option>
                    {invoices.map((i) => <option key={i.id} value={i.id}>#{i.invoice_number} — {i.to_client_name} ({formatCurrency(i.total, 'INR')})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none" placeholder="Optional notes..." />
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm">
                {editing ? 'Update Income' : 'Add Income'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Income"
        message="Are you sure you want to delete this income record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
