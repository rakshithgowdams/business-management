import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowRight, TrendingUp } from 'lucide-react';
import { formatINR } from '../../../lib/format';

interface GSTData {
  totalRevenue: number;
  gstCollected: number;
  gstPaid: number;
  netGST: number;
  monthlyBreakdown: { month: string; collected: number; paid: number }[];
}

export default function GSTWidget({ data }: { data: GSTData }) {
  const nav = useNavigate();
  const liability = data.gstCollected - data.gstPaid;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">GST Summary</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/gst')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-[10px] text-gray-500 mb-1">GST Collected</p>
          <p className="text-sm font-bold text-emerald-400">{formatINR(data.gstCollected)}</p>
          <p className="text-[10px] text-gray-600">From invoices</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-[10px] text-gray-500 mb-1">GST Paid</p>
          <p className="text-sm font-bold text-red-400">{formatINR(data.gstPaid)}</p>
          <p className="text-[10px] text-gray-600">On expenses</p>
        </div>
      </div>

      <div className={`p-3 rounded-lg flex items-center justify-between ${
        liability >= 0 ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-emerald-500/5 border border-emerald-500/10'
      }`}>
        <div>
          <p className="text-[10px] text-gray-500">Net GST Liability</p>
          <p className={`text-base font-bold ${liability >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatINR(Math.abs(liability))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500">Taxable Revenue</p>
          <p className="text-sm font-semibold text-white">{formatINR(data.totalRevenue)}</p>
        </div>
      </div>

      {data.monthlyBreakdown.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Recent Months
          </p>
          {data.monthlyBreakdown.slice(-3).map(m => (
            <div key={m.month} className="flex items-center gap-3 text-xs">
              <span className="text-gray-500 w-8">{m.month}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500/60" style={{ width: `${data.gstCollected > 0 ? (m.collected / data.gstCollected) * 100 : 0}%` }} />
              </div>
              <span className="text-amber-400 font-semibold tabular-nums w-20 text-right">{formatINR(m.collected)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
