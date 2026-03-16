import { useEffect, useState, useRef } from 'react';
import {
  Plus, Download, Eye, CheckCircle, Trash2, Pencil, Search, Send, Copy,
  FileText, Filter, IndianRupee, Clock, AlertTriangle, X,
  TrendingUp, BarChart2, Calendar, Tag,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../../../lib/invoicePdf';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency, formatDate } from '../../../lib/format';
import ConfirmDialog from '../../../components/ConfirmDialog';
import EmptyState from '../../../components/EmptyState';
import InvoicePreviewTemplate from '../../../components/InvoicePreviewTemplate';
import type { Invoice, BankDetails } from '../../../lib/invoicing/types';
import InvoiceForm from './InvoiceForm';

const statusColor = (s: string) => {
  if (s === 'paid') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (s === 'overdue') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (s === 'sent') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (s === 'cancelled') return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
  return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
};

const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
const SORT_OPTIONS = [
  { label: 'Date (Newest)', key: 'date_desc' },
  { label: 'Date (Oldest)', key: 'date_asc' },
  { label: 'Amount (High)', key: 'amount_desc' },
  { label: 'Amount (Low)', key: 'amount_asc' },
  { label: 'Client Name', key: 'client' },
] as const;

type ViewMode = 'table' | 'analytics';

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

export default function InvoiceList() {
  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [duplicateInvoice, setDuplicateInvoice] = useState<Invoice | null>(null);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [pdfInvoice, setPdfInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [logoSignedUrl, setLogoSignedUrl] = useState('');
  const [signatureSignedUrl, setSignatureSignedUrl] = useState('');
  const [showBankDetails] = useState(true);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder_name: '', account_number: '', ifsc_code: '', bank_name: '',
  });

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadInvoices(false);
      loadProfile();
    }
  }, [user]);

  const loadSignedUrl = async (path: string, setter: (v: string) => void) => {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    if (data?.signedUrl) setter(data.signedUrl);
  };

  const loadProfile = async () => {
    const { data: d } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
    if (!d) return;
    setBankDetails({ account_holder_name: d.bank_account_name || '', account_number: d.bank_account_number || '', ifsc_code: d.bank_ifsc_code || '', bank_name: d.bank_name || '' });
    if (d.business_logo_url) loadSignedUrl(d.business_logo_url, setLogoSignedUrl);
    if (d.signature_url) loadSignedUrl(d.signature_url, setSignatureSignedUrl);
  };

  const loadInvoices = async (_force = false) => {
    type RawInvoice = Record<string, unknown>;
    const data: RawInvoice[] = await (async () => {
      const { data: invData } = await supabase.from('invoices').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (!invData?.length) return [];
      const ids = invData.map((i: RawInvoice) => i.id as string);
      const { data: allItems } = await supabase.from('invoice_items').select('*').in('invoice_id', ids);
      const itemsByInvoice: Record<string, unknown[]> = {};
      for (const item of allItems || []) {
        const ii = item as Record<string, unknown>;
        const iid = ii.invoice_id as string;
        if (!itemsByInvoice[iid]) itemsByInvoice[iid] = [];
        itemsByInvoice[iid].push(item);
      }
      return invData.map((inv: RawInvoice) => ({ ...inv, _items: itemsByInvoice[inv.id as string] || [] }));
    })();

    const result: Invoice[] = (data || []).map((inv: RawInvoice) => ({
      ...inv,
      discount: Number(inv.discount),
      discount_type: (inv.discount_type as string) || 'flat',
      subtotal: Number(inv.subtotal),
      tax_amount: Number(inv.tax_amount),
      total: Number(inv.total),
      to_phone: (inv.to_phone as string) || '',
      payment_terms: (inv.payment_terms as string) || '',
      place_of_supply: (inv.place_of_supply as string) || '',
      po_number: (inv.po_number as string) || '',
      theme_id: (inv.theme_id as string) || 'classic-bw',
      custom_theme: (inv.custom_theme as Record<string, unknown> | null) || null,
      signatory_name: (inv.signatory_name as string) || '',
      signatory_designation: (inv.signatory_designation as string) || '',
      items: ((inv._items as Record<string, unknown>[]) || []).map((i) => ({
        description: i.description as string,
        hsn_sac: (i.hsn_sac as string) || '',
        unit: (i.unit as string) || 'Nos',
        qty: Number(i.qty),
        rate: Number(i.rate),
        amount: Number(i.amount),
        gst_rate: Number(i.gst_rate),
      })),
    } as Invoice));
    setInvoices(result);
    setLoading(false);
  };

  const getNextNumber = () => {
    const nums = invoices.map((i) => { const m = i.invoice_number.match(/INV-(\d+)/); return m ? parseInt(m[1]) : 0; });
    return `INV-${String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
  };

  const q = search.toLowerCase();
  const filtered = invoices
    .filter((inv) => (statusFilter === 'all' || inv.status === statusFilter) && (!search || inv.invoice_number.toLowerCase().includes(q) || inv.to_client_name.toLowerCase().includes(q)))
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime();
      if (sortBy === 'date_asc') return new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime();
      if (sortBy === 'amount_desc') return b.total - a.total;
      if (sortBy === 'amount_asc') return a.total - b.total;
      return a.to_client_name.localeCompare(b.to_client_name);
    });

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const pendingInvoices = invoices.filter((i) => i.status === 'draft' || i.status === 'sent');
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const sumOf = (arr: Invoice[]) => arr.reduce((s, i) => s + i.total, 0);

  const markAsSent = async (id: string) => {
    await supabase.from('invoices').update({ status: 'sent' }).eq('id', id);
    toast.success('Marked as sent');
    loadInvoices(true);
  };

  const markAsPaid = async (id: string) => {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', id);
    toast.success('Marked as paid');
    loadInvoices(true);
  };

  const markAsOverdue = async (id: string) => {
    await supabase.from('invoices').update({ status: 'overdue' }).eq('id', id);
    toast.success('Marked as overdue');
    loadInvoices(true);
  };

  const markAsCancelled = async (id: string) => {
    await supabase.from('invoices').update({ status: 'cancelled' }).eq('id', id);
    toast.success('Marked as cancelled');
    loadInvoices(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('invoice_items').delete().eq('invoice_id', deleteId);
    await supabase.from('invoices').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Invoice deleted');
    loadInvoices(true);
  };

  const handleDuplicate = (inv: Invoice) => {
    setDuplicateInvoice({ ...inv, id: '', invoice_number: getNextNumber() });
    setEditInvoice(null);
    setShowForm(true);
  };

  const downloadPDF = async (inv: Invoice) => {
    setGeneratingPdf(true);
    toast.loading('Generating PDF...', { id: 'pdf-gen' });
    setPdfInvoice(inv);
    await new Promise((r) => setTimeout(r, 600));
    if (!pdfRef.current) {
      setGeneratingPdf(false);
      setPdfInvoice(null);
      toast.dismiss('pdf-gen');
      toast.error('PDF generation failed');
      return;
    }
    try {
      await generateInvoicePDF(pdfRef.current, `${inv.invoice_number}.pdf`, {
        docNumber: inv.invoice_number,
        docDate: inv.invoice_date,
        clientName: inv.to_client_name,
        isInvoice: true,
      });
      toast.dismiss('pdf-gen');
      toast.success('PDF downloaded');
    } catch {
      toast.dismiss('pdf-gen');
      toast.error('PDF generation failed');
    }
    setPdfInvoice(null);
    setGeneratingPdf(false);
  };

  const downloadPDFFromPreview = async () => {
    if (!preview) return;
    setGeneratingPdf(true);
    toast.loading('Generating PDF...', { id: 'pdf-gen' });
    await new Promise((r) => setTimeout(r, 300));
    if (!previewRef.current) {
      setGeneratingPdf(false);
      toast.dismiss('pdf-gen');
      toast.error('PDF generation failed');
      return;
    }
    try {
      await generateInvoicePDF(previewRef.current, `${preview.invoice_number}.pdf`, {
        docNumber: preview.invoice_number,
        docDate: preview.invoice_date,
        clientName: preview.to_client_name,
        isInvoice: true,
      });
      toast.dismiss('pdf-gen');
      toast.success('PDF downloaded');
    } catch {
      toast.dismiss('pdf-gen');
      toast.error('PDF generation failed');
    }
    setGeneratingPdf(false);
  };

  const onFormClose = () => {
    setShowForm(false);
    setEditInvoice(null);
    setDuplicateInvoice(null);
    loadInvoices(true);
  };

  const monthlyChartData = (() => {
    const map: Record<string, { paid: number; pending: number }> = {};
    invoices.forEach((inv) => {
      const m = inv.invoice_date?.slice(0, 7) || '';
      if (!m) return;
      if (!map[m]) map[m] = { paid: 0, pending: 0 };
      if (inv.status === 'paid') map[m].paid += inv.total;
      else if (inv.status !== 'cancelled') map[m].pending += inv.total;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, vals]) => ({
      name: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      ...vals,
    }));
  })();

  const topClients = (() => {
    const map: Record<string, number> = {};
    invoices.filter((i) => i.status === 'paid').forEach((i) => { map[i.to_client_name] = (map[i.to_client_name] || 0) + i.total; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  })();

  const collectionRate = invoices.length > 0 ? ((paidInvoices.length / invoices.length) * 100).toFixed(0) : '0';
  const avgInvoiceValue = invoices.length > 0 ? sumOf(invoices) / invoices.length : 0;

  const CLIENT_COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

  if (showForm) {
    return (
      <InvoiceForm
        invoice={editInvoice || duplicateInvoice || undefined}
        isEdit={!!editInvoice}
        onClose={onFormClose}
      />
    );
  }

  const cards = [
    { label: 'Total Invoices', count: invoices.length, amount: sumOf(invoices), icon: FileText, a: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-t-blue-500' },
    { label: 'Collected', count: paidInvoices.length, amount: sumOf(paidInvoices), icon: CheckCircle, a: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-t-emerald-500' },
    { label: 'Pending', count: pendingInvoices.length, amount: sumOf(pendingInvoices), icon: Clock, a: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-t-amber-500' },
    { label: 'Overdue', count: overdueInvoices.length, amount: sumOf(overdueInvoices), icon: AlertTriangle, a: 'text-red-400', bg: 'bg-red-500/10', border: 'border-t-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Create, manage and track all your invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1">
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <FileText className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setViewMode('analytics')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'analytics' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>
          <button onClick={() => { setEditInvoice(null); setDuplicateInvoice(null); setShowForm(true); }} className="px-4 py-2.5 text-sm font-semibold rounded-xl gradient-orange text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`glass-card rounded-xl p-4 border-t-2 ${c.border}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}><c.icon className={`w-4 h-4 ${c.a}`} /></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{c.label}</span>
            </div>
            <p className="text-2xl font-bold">{c.count}</p>
            <p className={`text-sm font-semibold mt-1 ${c.a}`}>{formatCurrency(c.amount)}</p>
          </div>
        ))}
      </div>

      {viewMode === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Collection Rate', value: `${collectionRate}%`, sub: `${paidInvoices.length} of ${invoices.length} paid`, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Avg Invoice Value', value: formatCurrency(avgInvoiceValue), sub: 'across all invoices', icon: IndianRupee, color: 'text-blue-400' },
              { label: 'Outstanding', value: formatCurrency(sumOf(pendingInvoices) + sumOf(overdueInvoices)), sub: `${pendingInvoices.length + overdueInvoices.length} unpaid`, icon: Calendar, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Monthly Revenue — Paid vs Pending</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area dataKey="paid" name="Paid" stroke="#10B981" strokeWidth={2} fill="url(#paidGrad)" />
                  <Area dataKey="pending" name="Pending" stroke="#F59E0B" strokeWidth={2} fill="url(#pendingGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {topClients.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-[#FF6B00]" />
                <p className="text-sm font-semibold">Top Clients by Revenue</p>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Revenue" radius={[0, 4, 4, 0]}>
                      {topClients.map((_, i) => <Cell key={i} fill={CLIENT_COLORS[i % CLIENT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'table' && (
        <>
          <div className="glass-card rounded-xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Search invoice # or client..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 hidden md:block" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none">
                  {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3.5 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${statusFilter === s ? 'gradient-orange text-white' : 'bg-dark-800 text-gray-400 border border-white/10 hover:border-white/20'}`}>
                  {s === 'all' ? `All (${invoices.length})` : `${s} (${invoices.filter((i) => i.status === s).length})`}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No invoices found" description={invoices.length === 0 ? 'Create your first professional GST-compliant invoice.' : 'No invoices match your current filters.'} />
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/5">
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Invoice #</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider hidden md:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => (
                      <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3 font-semibold">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-gray-300">{inv.to_client_name}</td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{formatDate(inv.invoice_date)}</td>
                        <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                          {inv.due_date ? (
                            <span className={new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'cancelled' ? 'text-red-400' : ''}>
                              {formatDate(inv.due_date)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize ${statusColor(inv.status)}`}>{inv.status}</span></td>
                        <td className="px-4 py-3 text-right font-bold text-white">{formatCurrency(inv.total, inv.currency)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setPreview(inv)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Preview"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => { setEditInvoice(inv); setDuplicateInvoice(null); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Edit"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => downloadPDF(inv)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Download PDF"><Download className="w-4 h-4" /></button>
                            <button onClick={() => handleDuplicate(inv)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Duplicate"><Copy className="w-4 h-4" /></button>
                            {inv.status === 'draft' && <button onClick={() => markAsSent(inv.id)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-400 hover:text-blue-400" title="Mark as Sent"><Send className="w-4 h-4" /></button>}
                            {inv.status !== 'paid' && inv.status !== 'cancelled' && <button onClick={() => markAsPaid(inv.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400" title="Mark as Paid"><CheckCircle className="w-4 h-4" /></button>}
                            {(inv.status === 'sent' || inv.status === 'draft') && <button onClick={() => markAsOverdue(inv.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400" title="Mark as Overdue"><AlertTriangle className="w-4 h-4" /></button>}
                            {inv.status !== 'cancelled' && <button onClick={() => markAsCancelled(inv.id)} className="p-1.5 rounded-lg hover:bg-gray-500/10 text-gray-400 hover:text-gray-500" title="Cancel"><X className="w-4 h-4" /></button>}
                            <button onClick={() => setDeleteId(inv.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-gray-500">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-500">Total: <span className="text-white font-semibold">{formatCurrency(filtered.reduce((s, i) => s + i.total, 0))}</span></p>
              </div>
            </div>
          )}
        </>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto py-8 px-4">
          <div className="max-w-[850px] mx-auto">
            <div className="flex justify-end gap-2 mb-4">
              <button
                onClick={downloadPDFFromPreview}
                disabled={generatingPdf}
                className="px-4 py-2 text-sm font-medium rounded-lg gradient-orange text-white flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> {generatingPdf ? 'Generating...' : 'Download PDF'}
              </button>
              <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Close</button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl">
              <InvoicePreviewTemplate
                ref={previewRef}
                type="invoice"
                themeId={(preview as any).theme_id || 'classic-bw'}
                customThemeOverrides={(preview as any).custom_theme}
                docNumber={preview.invoice_number}
                docDate={preview.invoice_date}
                dueDate={preview.due_date}
                fromBusinessName={preview.from_business_name}
                fromAddress={preview.from_address}
                fromGstin={preview.from_gstin}
                fromEmail={preview.from_email}
                fromPhone={preview.from_phone}
                fromLogoUrl={logoSignedUrl}
                toClientName={preview.to_client_name}
                toAddress={preview.to_address}
                toGstin={preview.to_gstin}
                toEmail={preview.to_email}
                toPhone={preview.to_phone}
                items={preview.items}
                subtotal={preview.subtotal}
                taxAmount={preview.tax_amount}
                discount={preview.discount}
                discountType={preview.discount_type}
                total={preview.total}
                currency={preview.currency}
                notes={preview.notes}
                terms={preview.terms}
                bankDetails={bankDetails}
                showBankDetails={showBankDetails}
                signatureUrl={signatureSignedUrl}
                signatoryName={(preview as any).signatory_name || ''}
                signatoryDesignation={(preview as any).signatory_designation || ''}
                paymentTerms={preview.payment_terms}
                placeOfSupply={preview.place_of_supply}
                poNumber={preview.po_number}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Invoice" message="Are you sure you want to delete this invoice? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      {pdfInvoice && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '850px', zIndex: -1 }}>
          <InvoicePreviewTemplate
            ref={pdfRef}
            type="invoice"
            themeId={(pdfInvoice as any).theme_id || 'classic-bw'}
            customThemeOverrides={(pdfInvoice as any).custom_theme}
            docNumber={pdfInvoice.invoice_number}
            docDate={pdfInvoice.invoice_date}
            dueDate={pdfInvoice.due_date}
            fromBusinessName={pdfInvoice.from_business_name}
            fromAddress={pdfInvoice.from_address}
            fromGstin={pdfInvoice.from_gstin}
            fromEmail={pdfInvoice.from_email}
            fromPhone={pdfInvoice.from_phone}
            fromLogoUrl={logoSignedUrl}
            toClientName={pdfInvoice.to_client_name}
            toAddress={pdfInvoice.to_address}
            toGstin={pdfInvoice.to_gstin}
            toEmail={pdfInvoice.to_email}
            toPhone={pdfInvoice.to_phone}
            items={pdfInvoice.items}
            subtotal={pdfInvoice.subtotal}
            taxAmount={pdfInvoice.tax_amount}
            discount={pdfInvoice.discount}
            discountType={pdfInvoice.discount_type}
            total={pdfInvoice.total}
            currency={pdfInvoice.currency}
            notes={pdfInvoice.notes}
            terms={pdfInvoice.terms}
            bankDetails={bankDetails}
            showBankDetails={showBankDetails}
            signatureUrl={signatureSignedUrl}
            signatoryName={(pdfInvoice as any).signatory_name || ''}
            signatoryDesignation={(pdfInvoice as any).signatory_designation || ''}
            paymentTerms={pdfInvoice.payment_terms}
            placeOfSupply={pdfInvoice.place_of_supply}
            poNumber={pdfInvoice.po_number}
          />
        </div>
      )}
    </div>
  );
}
