interface AIInsights {
  TOP_STRENGTH: string;
  TOP_RISK: string;
  QUICK_WIN: string;
  MONTHLY_GOAL: string;
  SCORE_PREDICTION: string;
}

interface Props {
  insights: AIInsights | null;
  loading: boolean;
}

const cards = [
  { key: 'TOP_STRENGTH' as const, icon: '\uD83D\uDCAA', label: 'Your Biggest Strength', border: 'border-emerald-500/20' },
  { key: 'TOP_RISK' as const, icon: '\u26A0\uFE0F', label: 'Biggest Risk Right Now', border: 'border-red-500/20' },
  { key: 'QUICK_WIN' as const, icon: '\u26A1', label: 'Quick Win This Week', border: 'border-orange-500/20' },
  { key: 'MONTHLY_GOAL' as const, icon: '\uD83C\uDFAF', label: 'Monthly Goal', border: 'border-blue-500/20' },
  { key: 'SCORE_PREDICTION' as const, icon: '\uD83D\uDCC8', label: 'Score Prediction', border: 'border-yellow-500/20' },
];

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded bg-dark-600 animate-pulse" />
        <span className="text-sm text-gray-500">AI is analyzing your business data...</span>
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="glass-card rounded-xl p-4 space-y-2">
          <div className="h-4 w-40 bg-dark-600 rounded animate-pulse" />
          <div className="h-3 w-full bg-dark-700 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-dark-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function AIInsightCards({ insights, loading }: Props) {
  if (loading) return <Skeleton />;
  if (!insights) return null;

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <div key={card.key} className={`glass-card rounded-xl p-4 border ${card.border}`}>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">
            {card.icon} {card.label}
          </p>
          <p className="text-sm text-gray-200 leading-relaxed">
            "{insights[card.key]}"
          </p>
        </div>
      ))}
      <div className="flex justify-end">
        <span className="text-[10px] text-gray-600 bg-dark-700 px-2 py-1 rounded-full">
          Powered by Gemini 2.5 Flash
        </span>
      </div>
    </div>
  );
}
