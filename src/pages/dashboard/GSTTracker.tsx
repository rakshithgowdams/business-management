import { useEffect, useState } from 'react';
import { Download, FileText, TrendingUp, TrendingDown, BarChart2, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../lib/format';
import EmptyState from '../../components/EmptyState';

interface MonthlyGST {
  month: string;
  collected: number;
  paid: number;
  liability: number;
}

interface RateBreakdown {
  rate: number;
  collected: number;
  paid: number;
}

interface FilingPeriod {
  period: string;
  label: string;
  startMonth: string;
  endMonth: string;
  liability: number;
  status: 'filed' | 'due' | 'upcoming';
}

type ViewMode = 'overview' | 'returns' | 'analytics';

const GST_RATES_COLORS: Record<number, string> = {
  0: '#6B7280',
  5: '#3B82F6',
  12: '#F59E0B',
  18: '#EF4444',
  28: '#8B5CF6',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function GSTTracker() {
  const { user } = useAuth();
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyGST[]>([]);
  const [rateBreakdown, setRateBreakdown] = useState<RateBreakdown[]>([]);
  const [filingPeriods, setFilingPeriods] = useState<FilingPeriod[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedQuarter, setSelectedQuarter] = useState('all');

  useEffect(() => {
    if (user) loadGSTData();
  }, [user]);

  const loadGSTData = async () => {
    const [invoicesRes, expensesRes, invoiceItemsRes] = await Promise.all([
      supabase.from('invoices').select('*, invoice_items(*)').eq('user_id', user!.id),
      supabase.from('expenses').select('*').eq('user_id', user!.id),
      supabase.from('invoices').select('id, invoice_date, invoice_items(amount, gst_rate)').eq('user_id', user!.id),
    ]);

    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];
    const invoiceWithItems = invoiceItemsRes.data || [];

    let gstCollected = 0;
    invoices.forEach((inv) => {
      gstCollected += Number(inv.tax_amount || 0);
    });
    setTotalCollected(gstCollected);

    const gstPaid = expenses.reduce((sum, exp) => {
      const amount = Number(exp.amount);
      const estimatedGST = (amount * 0.18) / 1.18;
      return sum + estimatedGST;
    }, 0);
    setTotalPaid(gstPaid);

    const monthMap = new Map<string, { collected: number; paid: number }>();
    invoices.forEach((inv) => {
      const m = inv.invoice_date?.substring(0, 7) || '';
      if (!m) return;
      const curr = monthMap.get(m) || { collected: 0, paid: 0 };
      curr.collected += Number(inv.tax_amount || 0);
      monthMap.set(m, curr);
    });
    expenses.forEach((exp) => {
      const m = exp.date?.substring(0, 7) || '';
      if (!m) return;
      const curr = monthMap.get(m) || { collected: 0, paid: 0 };
      const amount = Number(exp.amount);
      curr.paid += (amount * 0.18) / 1.18;
      monthMap.set(m, curr);
    });

    const monthly = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        collected: data.collected,
        paid: data.paid,
        liability: data.collected - data.paid,
      }));
    setMonthlyData(monthly);

    const rateMap = new Map<number, { collected: number; paid: number }>();
    [0, 5, 12, 18, 28].forEach((r) => rateMap.set(r, { collected: 0, paid: 0 }));
    invoiceWithItems.forEach((inv) => {
      const items = (inv as Record<string, unknown>).invoice_items as Array<{ amount: number; gst_rate: number }> || [];
      items.forEach((item) => {
        const rate = Number(item.gst_rate) || 0;
        const gst = (Number(item.amount) * rate) / 100;
        const curr = rateMap.get(rate) || { collected: 0, paid: 0 };
        curr.collected += gst;
        rateMap.set(rate, curr);
      });
    });
    const breakdown = Array.from(rateMap.entries())
      .map(([rate, data]) => ({ rate, collected: data.collected, paid: data.paid }))
      .sort((a, b) => a.rate - b.rate);
    setRateBreakdown(breakdown);

    const quartersMap = new Map<string, { liability: number; months: string[] }>();
    monthly.forEach(({ month, liability }) => {
      const [yr, mo] = month.split('-').map(Number);
      const q = Math.ceil(mo / 3);
      const key = `${yr}-Q${q}`;
      const curr = quartersMap.get(key) || { liability: 0, months: [] };
      curr.liability += liability;
      curr.months.push(month);
      quartersMap.set(key, curr);
    });

    const now = new Date();
    const currentYr = now.getFullYear();
    const currentMo = now.getMonth() + 1;
    const currentQ = Math.ceil(currentMo / 3);

    const periods: FilingPeriod[] = Array.from(quartersMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => {
        const [yrStr, qStr] = key.split('-');
        const yr = Number(yrStr);
        const q = Number(qStr.replace('Q', ''));
        const isPast = yr < currentYr || (yr === currentYr && q < currentQ);
        const isCurrent = yr === currentYr && q === currentQ;
        const startMo = (q - 1) * 3 + 1;
        const endMo = q * 3;
        const startLabel = new Date(yr, startMo - 1, 1).toLocaleString('default', { month: 'short' });
        const endLabel = new Date(yr, endMo - 1, 1).toLocaleString('default', { month: 'short' });
        return {
          period: key,
          label: `${startLabel} - ${endLabel} ${yr}`,
          startMonth: `${yr}-${String(startMo).padStart(2, '0')}`,
          endMonth: `${yr}-${String(endMo).padStart(2, '0')}`,
          liability: data.liability,
          status: isPast ? 'filed' : isCurrent ? 'due' : 'upcoming',
        } as FilingPeriod;
      });
    setFilingPeriods(periods);
  };

  const exportCSV = () => {
    const headers = ['Month,GST Collected,GST Paid (Est.),Net Liability'];
    const rows = monthlyData.map(
      (m) => `${m.month},${m.collected.toFixed(2)},${m.paid.toFixed(2)},${m.liability.toFixed(2)}`
    );
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gst-report.csv';
    a.click();
  };

  const netLiability = totalCollected - totalPaid;

  const filteredMonthly = selectedQuarter === 'all'
    ? monthlyData
    : monthlyData.filter(m => {
        const [yr, mo] = m.month.split('-').map(Number);
        const q = Math.ceil(mo / 3);
        return `${yr}-Q${q}` === selectedQuarter;
      });

  const chartData = monthlyData.slice(-12).map(m => ({
    month: m.month.substring(5),
    Collected: m.collected,
    Paid: m.paid,
    Liability: m.liability,
  }));

  const pieData = rateBreakdown
    .filter(r => r.collected > 0)
    .map(r => ({ name: `${r.rate}%`, value: r.collected }));

  const quarters = Array.from(new Set(
    monthlyData.map(m => {
      const [yr, mo] = m.month.split('-').map(Number);
      return `${yr}-Q${Math.ceil(mo / 3)}`;
    })
  )).sort();

  const inputClass = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">GST Tracker</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 overflow-hidden text-sm">
            {(['overview', 'returns', 'analytics'] as ViewMode[]).map((v) => (
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
            onClick={exportCSV}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-400">GST Collected</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatINR(totalCollected)}</p>
          <p className="text-xs text-gray-500 mt-1">From invoices</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <p className="text-sm text-gray-400">Input Tax Credit</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatINR(totalPaid)}</p>
          <p className="text-xs text-gray-500 mt-1">Est. from expenses</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-brand-400" />
            <p className="text-sm text-gray-400">Net Liability</p>
          </div>
          <p className={`text-2xl font-bold ${netLiability >= 0 ? 'text-brand-400' : 'text-green-400'}`}>
            {formatINR(Math.abs(netLiability))}
          </p>
          <p className="text-xs text-gray-500 mt-1">{netLiability >= 0 ? 'Payable to govt' : 'ITC excess'}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Effective Rate</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {totalCollected > 0 ? ((totalCollected / (monthlyData.reduce((s, m) => s + m.collected + m.paid, 0) || 1)) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Avg GST rate</p>
        </div>
      </div>

      {viewMode === 'overview' && (
        <>
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">GST by Rate Slab</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {rateBreakdown.map((rb) => (
                <div
                  key={rb.rate}
                  className="bg-dark-800 rounded-xl p-4 text-center border border-white/5"
                  style={{ borderTop: `3px solid ${GST_RATES_COLORS[rb.rate] || '#6B7280'}` }}
                >
                  <p className="text-xl font-bold" style={{ color: GST_RATES_COLORS[rb.rate] || '#6B7280' }}>{rb.rate}%</p>
                  <p className="text-[11px] text-gray-400 mt-2">Collected</p>
                  <p className="text-sm font-semibold text-white">{formatINR(rb.collected)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Monthly GST Summary</h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="text-xs bg-dark-800 border border-white/10 rounded-lg px-2 py-1.5 text-gray-300"
                >
                  <option value="all">All Quarters</option>
                  {quarters.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>
            {filteredMonthly.length === 0 ? (
              <EmptyState title="No GST data" description="GST data is automatically calculated from your invoices and expenses." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/5">
                      <th className="px-4 py-3 font-medium">Month</th>
                      <th className="px-4 py-3 font-medium text-right">Collected</th>
                      <th className="px-4 py-3 font-medium text-right">ITC (Est.)</th>
                      <th className="px-4 py-3 font-medium text-right">Net Payable</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonthly.map((m) => (
                      <tr key={m.month} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium">
                          {new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400 font-medium">{formatINR(m.collected)}</td>
                        <td className="px-4 py-3 text-right text-red-400">{formatINR(m.paid)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${m.liability >= 0 ? 'text-brand-400' : 'text-green-400'}`}>
                          {m.liability >= 0 ? '+' : '-'}{formatINR(Math.abs(m.liability))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.collected > 0 ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">Active</span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-500 font-medium">No GST</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 bg-white/[0.02]">
                      <td className="px-4 py-3 font-bold text-sm">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-green-400">{formatINR(filteredMonthly.reduce((s, m) => s + m.collected, 0))}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-400">{formatINR(filteredMonthly.reduce((s, m) => s + m.paid, 0))}</td>
                      <td className="px-4 py-3 text-right font-bold text-brand-400">{formatINR(filteredMonthly.reduce((s, m) => s + m.liability, 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {viewMode === 'returns' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-semibold">Quarterly GST Returns</h3>
            </div>
            {filingPeriods.length === 0 ? (
              <EmptyState title="No filing data" description="Quarterly filing periods will appear once you have GST data." />
            ) : (
              <div className="space-y-3">
                {filingPeriods.map((fp) => (
                  <div
                    key={fp.period}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      fp.status === 'due'
                        ? 'bg-orange-500/5 border-orange-500/20'
                        : fp.status === 'filed'
                        ? 'bg-white/[0.02] border-white/5'
                        : 'bg-blue-500/5 border-blue-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {fp.status === 'filed' && <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
                      {fp.status === 'due' && <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />}
                      {fp.status === 'upcoming' && <Clock className="w-5 h-5 text-blue-400 shrink-0" />}
                      <div>
                        <p className="font-medium text-sm">{fp.period}</p>
                        <p className="text-xs text-gray-400">{fp.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Liability</p>
                        <p className={`font-semibold text-sm ${fp.liability >= 0 ? 'text-brand-400' : 'text-green-400'}`}>
                          {formatINR(Math.abs(fp.liability))}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        fp.status === 'filed'
                          ? 'bg-green-500/10 text-green-400'
                          : fp.status === 'due'
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {fp.status === 'filed' ? 'Period Closed' : fp.status === 'due' ? 'Current' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">GSTR-1 (Outward)</p>
              <p className="text-sm font-semibold text-white">Monthly / Quarterly</p>
              <p className="text-xs text-gray-500 mt-2">Report all sales invoices</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">GSTR-3B (Summary)</p>
              <p className="text-sm font-semibold text-white">Monthly</p>
              <p className="text-xs text-gray-500 mt-2">Summary return with tax payment</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">GSTR-9 (Annual)</p>
              <p className="text-sm font-semibold text-white">Yearly</p>
              <p className="text-xs text-gray-500 mt-2">Annual consolidated return</p>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {chartData.length === 0 ? (
            <EmptyState title="No analytics data" description="Analytics will appear once you have GST records." />
          ) : (
            <>
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-4">GST Trend (Last 12 Months)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gstCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gstPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Collected" stroke="#22C55E" fill="url(#gstCollected)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Paid" stroke="#EF4444" fill="url(#gstPaid)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Net GST Liability by Month</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Liability" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.Liability >= 0 ? '#FF6B00' : '#22C55E'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Collection by GST Rate</h3>
                  {pieData.length === 0 ? (
                    <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">No rate data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {pieData.map((entry, i) => {
                            const rate = parseInt(entry.name);
                            return <Cell key={i} fill={GST_RATES_COLORS[rate] || '#6B7280'} />;
                          })}
                        </Pie>
                        <Legend formatter={(v) => <span className="text-xs text-gray-400">{v}</span>} />
                        <Tooltip formatter={(v: any) => formatINR(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
