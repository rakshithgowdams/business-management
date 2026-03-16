import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface HealthScoreData {
  score: number;
  previousScore: number;
  label: string;
  history: { date: string; score: number }[];
  metrics: { label: string; score: number; weight: number }[];
}

function ScoreArc({ score }: { score: number }) {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const strokeLen = (score / 100) * circ * 0.75;
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <svg width="140" height="100" viewBox="0 0 140 100">
      <path
        d="M 14 90 A 56 56 0 1 1 126 90"
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 14 90 A 56 56 0 1 1 126 90"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${strokeLen} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="70" y="72" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">{score}</text>
      <text x="70" y="88" textAnchor="middle" fontSize="10" fill="#6B7280">/ 100</text>
    </svg>
  );
}

const MiniTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 text-xs text-white shadow">
      {payload[0].value}
    </div>
  );
};

export default function HealthScoreWidget({ data }: { data: HealthScoreData }) {
  const nav = useNavigate();
  const diff = data.score - data.previousScore;
  const color = data.score >= 75 ? '#10B981' : data.score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FF6B00]" />
          <h3 className="text-sm font-semibold text-white">Business Health</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/health-score')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          Details <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col items-center">
          <ScoreArc score={data.score} />
          <div className="flex items-center gap-1 -mt-1">
            {diff >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
            <span className={`text-[10px] font-semibold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {diff >= 0 ? '+' : ''}{diff} pts
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">{data.label}</p>
        </div>

        <div className="flex-1 space-y-2">
          {data.metrics.slice(0, 4).map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-gray-500 truncate">{m.label}</span>
                <span className="text-white font-semibold ml-2">{m.score}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${m.score}%`, background: m.score >= 75 ? '#10B981' : m.score >= 50 ? '#F59E0B' : '#EF4444' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.history.length > 1 && (
        <div className="h-14">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.history}>
              <Tooltip content={<MiniTooltip />} />
              <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
