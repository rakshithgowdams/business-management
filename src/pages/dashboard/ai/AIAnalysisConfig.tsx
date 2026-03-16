import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import {
  getModelForTask, COST_LABELS, SPEED_LABELS,
  TASK_CONFIGS, type TaskType,
} from '../../../lib/ai/models';

const ANALYSIS_TASKS: TaskType[] = [
  'business_analysis',
  'roi_calculation',
  'cold_messages',
  'competitor_analysis',
  'proposal_writing',
];

const TASK_LABELS: Record<string, string> = {
  business_analysis: 'Business Analysis',
  roi_calculation: 'ROI Calculator',
  cold_messages: 'Cold Messages',
  competitor_analysis: 'Competitor Data',
  proposal_writing: 'Proposal Writer',
};

export interface AnalysisModels {
  business_analysis: string;
  roi_calculation: string;
  cold_messages: string;
  competitor_analysis: string;
  proposal_writing: string;
}

export function getCurrentAnalysisModels(): AnalysisModels {
  const result: Record<string, string> = {};
  for (const task of ANALYSIS_TASKS) {
    const model = getModelForTask(task);
    result[task] = model.name;
  }
  return result as unknown as AnalysisModels;
}

export function getModelKeyForTask(task: TaskType): string {
  return getModelForTask(task).key;
}

interface Props {
  disabled?: boolean;
}

export default function AIAnalysisConfig({ disabled }: Props) {
  const [expanded, setExpanded] = useState(false);

  const models = getCurrentAnalysisModels();
  const smartAuto = localStorage.getItem('mfo_smart_auto_mode') !== 'false';

  const estimateCost = () => {
    let total = 0;
    for (const task of ANALYSIS_TASKS) {
      const model = getModelForTask(task);
      const baseCost = model.costTier === 1 ? 3 : model.costTier === 2 ? 8 : 15;
      total += baseCost;
    }
    return total;
  };

  const minCost = Math.round(estimateCost() * 0.7);
  const maxCost = Math.round(estimateCost() * 1.3);

  return (
    <div className={`glass-card rounded-xl overflow-hidden transition-all ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Settings2 className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold text-white">Analysis Configuration</span>
          {smartAuto && (
            <span className="text-[9px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">
              Smart Auto
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {ANALYSIS_TASKS.map((task) => {
            const model = getModelForTask(task);
            const taskConfig = TASK_CONFIGS.find((t) => t.key === task);
            return (
              <div key={task} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{taskConfig?.icon}</span>
                  <span className="text-xs text-gray-400">{TASK_LABELS[task]}:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white">{model.name}</span>
                  <span className="text-[10px] text-gray-500">
                    {SPEED_LABELS[model.speedTier].icon} {COST_LABELS[model.costTier]}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="border-t border-white/5 pt-2 mt-2">
            <p className="text-[11px] text-gray-500">
              Estimated cost: ~₹{minCost}-{maxCost} for full analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
