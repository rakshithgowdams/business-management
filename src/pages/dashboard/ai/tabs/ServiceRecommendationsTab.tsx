import { Zap, Clock, TrendingUp, DollarSign } from 'lucide-react';
import type { AnalysisResult } from '../../../../lib/ai/types';

interface Props {
  data: AnalysisResult;
}

export default function ServiceRecommendationsTab({ data }: Props) {
  return (
    <div className="space-y-4">
      {data.service_recommendations.map((rec, i) => (
        <div key={i} className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center text-white text-sm font-bold">#{rec.priority}</div>
              <div>
                <h3 className="text-sm font-bold text-white">{rec.service}</h3>
                {rec.priority === 1 && <span className="text-[10px] text-brand-400 font-medium uppercase tracking-wider">Top Recommended</span>}
              </div>
            </div>
            <span className="text-sm font-bold gradient-text">{rec.estimated_price}</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Why They Need This</p>
              <p className="text-sm text-gray-300 leading-relaxed">{rec.why_they_need_it}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Specific Solution to Build</p>
              <p className="text-sm text-white leading-relaxed">{rec.specific_solution}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-dark-700/50 rounded-lg p-3 text-center">
                <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Timeline</p>
                <p className="text-sm font-semibold text-white">{rec.implementation_time}</p>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-3 text-center">
                <DollarSign className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Investment</p>
                <p className="text-sm font-semibold text-white">{rec.estimated_price}</p>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-3 text-center">
                <TrendingUp className="w-4 h-4 text-brand-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">ROI</p>
                <p className="text-sm font-semibold text-white">{rec.roi_timeline}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {data.quick_wins.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-brand-400" /> Quick Wins in First 7 Days</h3>
          <div className="space-y-2">
            {data.quick_wins.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-green-400">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-300">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
