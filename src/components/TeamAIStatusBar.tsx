import { useEffect, useState } from 'react';
import { Bot, Zap, AlertTriangle } from 'lucide-react';
import { getTeamAIStatus, type TeamAIStatus } from '../lib/ai/teamApi';

export default function TeamAIStatusBar() {
  const [status, setStatus] = useState<TeamAIStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    const s = await getTeamAIStatus();
    setStatus(s);
    setLoading(false);
  };

  if (loading || !status) return null;

  if (!status.ai_enabled) {
    return (
      <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-[11px] text-red-400">AI access disabled</p>
        </div>
      </div>
    );
  }

  const usagePercent = Math.min(100, Math.round((status.credits_used / status.daily_limit) * 100));
  const isLow = status.credits_remaining < status.daily_limit * 0.2;
  const isDepleted = status.credits_remaining <= 0;

  return (
    <div className="mx-4 mb-3 px-3 py-2.5 rounded-lg bg-dark-800 border border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[11px] font-medium text-gray-300">AI Credits</span>
        </div>
        <span className={`text-[11px] font-bold ${isDepleted ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
          {status.credits_remaining}/{status.daily_limit}
        </span>
      </div>
      <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isDepleted ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${100 - usagePercent}%` }}
        />
      </div>
      {isDepleted && (
        <p className="text-[10px] text-red-400 mt-1">Limit reached. Resets tomorrow.</p>
      )}
    </div>
  );
}
