import { useEffect, useState, useCallback } from 'react';
import { CalendarClock, Zap, CheckCircle2, IndianRupee } from 'lucide-react';
import { formatINR } from '../../../lib/format';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface CardData {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}

interface Props {
  refreshKey?: number;
}

export default function FollowUpDashboard({ refreshKey }: Props) {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardData[]>([]);

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [historyRes, sequenceRes] = await Promise.all([
        supabase
          .from('followup_history')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('followup_sequences')
          .select('id, active')
          .eq('user_id', user.id)
          .eq('active', true),
      ]);

      const history = historyRes.data || [];
      const activeSeqs = (sequenceRes.data || []).length;

      const dueToday = history.filter(
        (h) => h.sent_at?.startsWith(today) && h.status === 'pending'
      ).length;

      const completedThisWeek = history.filter(
        (h) => h.status === 'sent' && new Date(h.sent_at) >= weekAgo
      ).length;

      const recovered = history
        .filter((h) => h.status === 'sent' && h.type === 'invoice_overdue' && h.amount)
        .reduce((sum, h) => sum + Number(h.amount || 0), 0);

      setCards([
        {
          label: 'Due Today',
          value: String(dueToday),
          sub: 'Follow-ups pending',
          icon: <CalendarClock className="w-5 h-5" />,
          color: 'from-orange-500/20 to-orange-600/5',
        },
        {
          label: 'Active Sequences',
          value: String(activeSeqs),
          sub: 'Running automations',
          icon: <Zap className="w-5 h-5" />,
          color: 'from-blue-500/20 to-blue-600/5',
        },
        {
          label: 'Completed This Week',
          value: String(completedThisWeek),
          sub: 'Messages sent',
          icon: <CheckCircle2 className="w-5 h-5" />,
          color: 'from-emerald-500/20 to-emerald-600/5',
        },
        {
          label: 'Revenue Recovered',
          value: formatINR(recovered),
          sub: 'From invoice follow-ups',
          icon: <IndianRupee className="w-5 h-5" />,
          color: 'from-teal-500/20 to-teal-600/5',
        },
      ]);
    } catch {
      setCards([]);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`glass-card glass-card-hover rounded-xl p-5 bg-gradient-to-br ${c.color}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {c.label}
            </span>
            <div className="text-orange-400">{c.icon}</div>
          </div>
          <p className="text-2xl font-bold text-white">{c.value}</p>
          <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
