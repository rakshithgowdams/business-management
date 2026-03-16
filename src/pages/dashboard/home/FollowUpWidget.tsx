import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '../../../lib/format';

interface FollowUpItem {
  id: string;
  client_name: string;
  follow_up_date: string;
  message_preview: string;
  status: string;
  channel: string;
}

interface FollowUpStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

const channelColor: Record<string, string> = {
  email: 'text-blue-400 bg-blue-500/10',
  whatsapp: 'text-emerald-400 bg-emerald-500/10',
  sms: 'text-amber-400 bg-amber-500/10',
  call: 'text-[#FF6B00] bg-[#FF6B00]/10',
};

export default function FollowUpWidget({ followUps, stats }: { followUps: FollowUpItem[]; stats: FollowUpStats }) {
  const nav = useNavigate();

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#FF6B00]" />
          <h3 className="text-sm font-semibold text-white">Follow-ups</h3>
          {stats.overdue > 0 && (
            <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">
              {stats.overdue} overdue
            </span>
          )}
        </div>
        <button
          onClick={() => nav('/dashboard/follow-ups')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: 'Done', value: stats.completed, color: 'text-emerald-400' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {followUps.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No upcoming follow-ups</p>
      ) : (
        <div className="space-y-2">
          {followUps.slice(0, 4).map(f => {
            const isOverdue = new Date(f.follow_up_date) < new Date() && f.status !== 'completed';
            return (
              <div key={f.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex-shrink-0 mt-0.5">
                  {f.status === 'completed'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : isOverdue
                      ? <AlertCircle className="w-4 h-4 text-red-400" />
                      : <Clock className="w-4 h-4 text-amber-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white truncate">{f.client_name}</span>
                    {f.channel && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${channelColor[f.channel] || 'text-gray-400 bg-gray-500/10'}`}>
                        {f.channel}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{f.message_preview}</p>
                </div>
                <span className={`text-[10px] font-medium flex-shrink-0 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                  {formatDate(f.follow_up_date)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
