import { CalendarClock, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatINR, daysRemaining } from '../../../lib/format';

interface EMIData {
  id: string;
  loan_name: string;
  emi_amount: number;
  next_due_date: string;
}

interface SubData {
  id: string;
  name: string;
  amount: number;
  next_billing_date: string;
  billing_cycle: string;
}

export default function UpcomingPayments({ emis, subscriptions }: { emis: EMIData[]; subscriptions: SubData[] }) {
  const nav = useNavigate();

  const upcoming = [
    ...emis.map(e => ({
      id: e.id,
      type: 'emi' as const,
      name: e.loan_name,
      amount: Number(e.emi_amount),
      dueDate: e.next_due_date,
      days: daysRemaining(e.next_due_date),
    })),
    ...subscriptions.map(s => ({
      id: s.id,
      type: 'sub' as const,
      name: s.name,
      amount: Number(s.amount),
      dueDate: s.next_billing_date,
      days: daysRemaining(s.next_billing_date),
    })),
  ]
    .filter(p => p.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  const totalUpcoming = upcoming.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Upcoming Payments</h3>
        </div>
        {totalUpcoming > 0 && (
          <span className="text-xs font-semibold text-amber-400">{formatINR(totalUpcoming)} due</span>
        )}
      </div>

      {upcoming.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No upcoming payments in the next 30 days</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                p.type === 'emi' ? 'bg-orange-500/10' : 'bg-cyan-500/10'
              }`}>
                {p.type === 'emi' ? (
                  <CalendarClock className="w-3.5 h-3.5 text-orange-400" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{p.name}</p>
                <p className="text-[10px] text-gray-500">{p.type === 'emi' ? 'EMI' : 'Subscription'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-white tabular-nums">{formatINR(p.amount)}</p>
                <p className={`text-[10px] font-medium ${p.days <= 7 ? 'text-red-400' : p.days <= 14 ? 'text-amber-400' : 'text-gray-500'}`}>
                  {p.days <= 0 ? 'Overdue' : p.days === 1 ? 'Tomorrow' : `${p.days}d left`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button onClick={() => nav('/dashboard/emi')} className="flex-1 text-[10px] text-center text-gray-500 hover:text-white py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors flex items-center justify-center gap-1">
          EMI Tracker <ArrowRight className="w-3 h-3" />
        </button>
        <button onClick={() => nav('/dashboard/subscriptions')} className="flex-1 text-[10px] text-center text-gray-500 hover:text-white py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors flex items-center justify-center gap-1">
          Subscriptions <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
