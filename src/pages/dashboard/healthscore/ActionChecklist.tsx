import { useState, useEffect } from 'react';

interface ActionItem {
  id: string;
  action: string;
  impact: 'High' | 'Medium' | 'Low';
  metric: string;
  completed: boolean;
}

interface Props {
  actions: ActionItem[];
}

const LS_KEY = 'mfo_health_actions_completed';

const impactColors: Record<string, string> = {
  High: 'text-red-400 bg-red-500/10 border-red-500/20',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Low: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

export default function ActionChecklist({ actions }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(LS_KEY);
    return new Set(saved ? JSON.parse(saved) : []);
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify([...completed]));
  }, [completed]);

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!actions.length) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-lg font-semibold text-white mb-4">This Month's Action Plan</h2>
      <div className="space-y-2">
        {actions.map((item) => {
          const done = completed.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                done ? 'border-emerald-400 bg-emerald-400' : 'border-gray-600'
              }`}>
                {done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {item.action}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Improves {item.metric}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${impactColors[item.impact]}`}>
                {item.impact}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
