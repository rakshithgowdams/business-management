import { useState } from 'react';
import { Calculator, TrendingUp, ArrowRight, Info } from 'lucide-react';
import { MODELS, COST_PER_CALL, TASK_CONFIGS } from '../../../lib/ai/models';

const CALLS_PRESETS = [50, 100, 250, 500, 1000];

export default function CostCalculator() {
  const [selectedModels, setSelectedModels] = useState<string[]>(['geminiFlash', 'claude', 'gpt4o']);
  const [callsPerMonth, setCallsPerMonth] = useState(100);
  const [customCalls, setCustomCalls] = useState('');

  const activeCalls = customCalls ? parseInt(customCalls) || 0 : callsPerMonth;

  const toggleModel = (key: string) => {
    setSelectedModels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const modelData = selectedModels
    .map((key) => {
      const model = MODELS[key];
      if (!model) return null;
      const costPerCall = COST_PER_CALL[model.id] || 0;
      const monthlyCost = costPerCall * activeCalls;
      const yearlyCost = monthlyCost * 12;
      return { key, model, costPerCall, monthlyCost, yearlyCost };
    })
    .filter(Boolean) as { key: string; model: typeof MODELS[string]; costPerCall: number; monthlyCost: number; yearlyCost: number }[];

  const cheapest = modelData.length > 0 ? modelData.reduce((a, b) => (a.monthlyCost < b.monthlyCost ? a : b)) : null;
  const mostExpensive = modelData.length > 0 ? modelData.reduce((a, b) => (a.monthlyCost > b.monthlyCost ? a : b)) : null;
  const savings = cheapest && mostExpensive ? mostExpensive.monthlyCost - cheapest.monthlyCost : 0;

  const taskEstimates = TASK_CONFIGS.map((task) => {
    const recModel = MODELS[task.recommendedModel];
    const cost = recModel ? COST_PER_CALL[recModel.id] || 0 : 0;
    return { task: task.label, model: recModel?.name || '', costPerCall: cost };
  });

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-[#FF6B00]" />
          <h3 className="font-semibold text-white">Cost Estimator</h3>
        </div>

        <div className="mb-5">
          <label className="text-xs text-gray-400 mb-2 block">Monthly API Calls</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {CALLS_PRESETS.map((n) => (
              <button
                key={n}
                onClick={() => { setCallsPerMonth(n); setCustomCalls(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeCalls === n && !customCalls
                    ? 'gradient-orange text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {n.toLocaleString()}
              </button>
            ))}
            <input
              type="number"
              placeholder="Custom"
              value={customCalls}
              onChange={(e) => setCustomCalls(e.target.value)}
              className="w-24 px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B00]/50"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs text-gray-400 mb-2 block">Select Models to Compare</label>
          <div className="flex gap-2 flex-wrap">
            {Object.values(MODELS).map((m) => (
              <button
                key={m.key}
                onClick={() => toggleModel(m.key)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  selectedModels.includes(m.key)
                    ? 'bg-[#FF6B00]/20 text-[#FF9A00] border border-[#FF6B00]/30'
                    : 'bg-dark-700 text-gray-500 hover:text-gray-300 border border-white/5'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {modelData.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                    <th className="pb-3 pr-4">Model</th>
                    <th className="pb-3 pr-4 text-right">Per Call</th>
                    <th className="pb-3 pr-4 text-right">Monthly ({activeCalls})</th>
                    <th className="pb-3 text-right">Yearly</th>
                  </tr>
                </thead>
                <tbody>
                  {modelData
                    .sort((a, b) => a.monthlyCost - b.monthlyCost)
                    .map((d) => (
                      <tr key={d.key} className={`border-b border-white/5 last:border-0 ${d.key === cheapest?.key ? 'bg-emerald-500/5' : ''}`}>
                        <td className="py-3 pr-4">
                          <span className="text-gray-300 text-xs">{d.model.name}</span>
                          {d.key === cheapest?.key && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Best Value</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right text-xs text-gray-400">{d.costPerCall.toFixed(2)} INR</td>
                        <td className="py-3 pr-4 text-right text-xs text-white font-semibold">{d.monthlyCost.toFixed(2)} INR</td>
                        <td className="py-3 text-right text-xs text-gray-400">{d.yearlyCost.toFixed(2)} INR</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {savings > 0 && cheapest && mostExpensive && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Potential Monthly Savings
                </div>
                <p className="text-white text-lg font-bold">{savings.toFixed(2)} INR/month</p>
                <p className="text-xs text-gray-500 mt-1">
                  By using {cheapest.model.name} instead of {mostExpensive.model.name}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Recommended Model Per Task</h3>
        </div>
        <div className="space-y-2">
          {taskEstimates.map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 transition-colors">
              <span className="text-xs text-gray-300">{t.task}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{t.model}</span>
                <ArrowRight className="w-3 h-3 text-gray-600" />
                <span className="text-xs text-[#FF9A00] font-medium">{t.costPerCall.toFixed(2)} INR</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
