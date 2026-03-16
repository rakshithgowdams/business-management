import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatINR, formatDate } from '../../../lib/format';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

export default function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  const nav = useNavigate();

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav('/dashboard/income')}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            Income <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => nav('/dashboard/expenses')}
            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            Expenses <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No transactions yet. Start by adding income or expenses.</p>
      ) : (
        <div className="space-y-1">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                {tx.type === 'income' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{tx.description}</p>
                <p className="text-[10px] text-gray-500">{tx.category}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-semibold tabular-nums ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                </p>
                <p className="text-[10px] text-gray-500">{formatDate(tx.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
