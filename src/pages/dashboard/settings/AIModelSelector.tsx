import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  TASK_CONFIGS, MODELS, COST_LABELS, SPEED_LABELS,
  getUserModelSettings, setUserModelSettings,
  type TaskType,
} from '../../../lib/ai/models';

interface Props {
  disabled: boolean;
}

export default function AIModelSelector({ disabled }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(getUserModelSettings);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setUserModelSettings(settings);
  }, [settings]);

  const handleSelect = (taskKey: TaskType, modelKey: string) => {
    setSettings({ ...settings, [taskKey]: modelKey });
    setOpenDropdown(null);
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          🎯 Select AI Model Per Task
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          All models run through your single OpenRouter key. Pick the best for each job.
        </p>
      </div>

      <div className="space-y-2">
        {TASK_CONFIGS.map((task) => {
          const selectedKey = settings[task.key] || task.recommendedModel;
          const selectedModel = MODELS[selectedKey];
          const isOpen = openDropdown === task.key;

          return (
            <div
              key={task.key}
              className={`rounded-lg border transition-all ${
                disabled
                  ? 'border-white/5 opacity-50 pointer-events-none'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-base shrink-0">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{task.label}</p>
                  <p className="text-[11px] text-gray-500 truncate">{task.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-500">{COST_LABELS[task.costTier]}</span>
                  <span className="text-[10px] text-gray-500">
                    {SPEED_LABELS[task.speedTier].icon} {SPEED_LABELS[task.speedTier].label}
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : task.key)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 border border-white/10 rounded-lg text-xs text-white hover:border-brand-500/30 min-w-[160px] justify-between"
                  >
                    <span className="truncate">{selectedModel?.name || 'Select'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-72 bg-dark-700 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                        {task.options.map((opt) => {
                          const model = MODELS[opt.modelKey];
                          if (!model) return null;
                          const isSelected = selectedKey === opt.modelKey;

                          return (
                            <button
                              key={opt.modelKey}
                              onClick={() => handleSelect(task.key, opt.modelKey)}
                              className={`w-full px-3 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                                isSelected ? 'bg-brand-600/10' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-white">{model.name}</span>
                                  {opt.recommended && (
                                    <span className="text-[9px] bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded-full font-semibold">
                                      RECOMMENDED
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-gray-500">{COST_LABELS[model.costTier]}</span>
                                  <span className="text-[9px] text-gray-500">{SPEED_LABELS[model.speedTier].icon}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5">{opt.note}</p>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
